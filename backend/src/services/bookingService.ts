import { Types } from 'mongoose';
import { Appointment, IAppointment, AppointmentType } from '../models/Appointment';
import { AppointmentSlot } from '../models/AppointmentSlot';
import { DoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { atomicLockSlot } from './slotService';
import { logAudit } from '../utils/auditLogger';
import { checkAndNotifyWaitlist } from './waitlistService';
import { resolveDoctorIdentifier } from '../utils/doctorResolver';

export interface BookAppointmentInput {
  patientId: string;
  doctorId: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type?: AppointmentType;
  reasonForVisit: string;
  symptomsSummary?: string;
  idempotencyKey?: string;
}

export const bookAppointment = async (
  input: BookAppointmentInput
): Promise<IAppointment> => {
  // Check Idempotency Key first
  if (input.idempotencyKey) {
    const existing = await Appointment.findOne({ idempotencyKey: input.idempotencyKey });
    if (existing) {
      return existing;
    }
  }

  // 1. Verify doctor exists and is VERIFIED
  const resolved = await resolveDoctorIdentifier(input.doctorId);
  const doctorProfile = resolved?.doctorProfile;

  if (!doctorProfile) {
    throw new Error('Doctor not found.');
  }

  if (doctorProfile.verificationStatus !== 'VERIFIED') {
    throw new Error('This medical practitioner is not currently verified to accept appointments.');
  }

  const doctorUserId = resolved.userId.toString();

  // 2. Concurrency-Safe Slot Reservation
  const slot = await atomicLockSlot(
    doctorUserId,
    input.appointmentDate,
    input.startTime,
    input.endTime,
    input.patientId
  );

  // 3. Generate Teleconsultation Room ID if needed
  let teleconsultationRoomId: string | undefined;
  if (input.type === 'TELECONSULTATION') {
    teleconsultationRoomId = `hms-room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // 4. Create Confirmed Appointment
  try {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const appointmentReference = `APT-${year}-${randomSuffix}`;

    const appointment = await Appointment.create({
      appointmentReference,
      patient: new Types.ObjectId(input.patientId),
      doctor: new Types.ObjectId(doctorUserId),
      department: doctorProfile.department,
      slot: slot._id,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      type: input.type || 'IN_PERSON',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      consultationFee: doctorProfile.consultationFee,
      reasonForVisit: input.reasonForVisit,
      symptomsSummary: input.symptomsSummary || '',
      idempotencyKey: input.idempotencyKey,
      teleconsultationRoomId,
    });

    // Update slot to BOOKED
    slot.status = 'BOOKED';
    slot.appointment = appointment._id;
    await slot.save();

    // Create notifications for Patient and Doctor
    await Notification.create([
      {
        user: input.patientId,
        title: 'Appointment Confirmed',
        message: `Your appointment (${appointment.appointmentReference}) on ${input.appointmentDate} at ${input.startTime} has been successfully confirmed.`,
        type: 'APPOINTMENT_CONFIRMED',
        actionUrl: `/patient/appointments`,
      },
      {
        user: doctorUserId,
        title: 'New Appointment Scheduled',
        message: `A new patient appointment (${appointment.appointmentReference}) is scheduled for ${input.appointmentDate} at ${input.startTime}.`,
        type: 'APPOINTMENT_CONFIRMED',
        actionUrl: `/doctor/dashboard`,
      },
    ]);

    await logAudit({
      actorId: input.patientId,
      actorRole: 'PATIENT',
      action: 'APPOINTMENT_BOOKED',
      targetResource: 'Appointment',
      targetId: appointment._id.toString(),
      details: {
        doctorId: doctorUserId,
        date: input.appointmentDate,
        time: input.startTime,
        fee: doctorProfile.consultationFee,
      },
    });

    return appointment;
  } catch (error) {
    // If appointment creation failed, release slot lock so it's not orphaned
    slot.status = 'AVAILABLE';
    slot.lockedBy = undefined;
    slot.lockExpiresAt = undefined;
    await slot.save();
    throw error;
  }
};

export const cancelAppointment = async (
  appointmentId: string,
  cancelledByUserId: string,
  userRole: string,
  reason: string
): Promise<IAppointment> => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found.');
  }

  // Authorization check: only patient, doctor, or admin/receptionist can cancel
  const isPatient = appointment.patient.toString() === cancelledByUserId;
  const isDoctor = appointment.doctor.toString() === cancelledByUserId;
  const isAdminOrStaff = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(userRole);

  if (!isPatient && !isDoctor && !isAdminOrStaff) {
    throw new Error('You do not have permission to cancel this appointment.');
  }

  if (appointment.status === 'CANCELLED') {
    throw new Error('This appointment has already been cancelled.');
  }

  if (appointment.status === 'COMPLETED') {
    throw new Error('Cannot cancel a completed appointment.');
  }

  // Release the slot back to AVAILABLE
  if (appointment.slot) {
    await AppointmentSlot.findByIdAndUpdate(appointment.slot, {
      status: 'AVAILABLE',
      $unset: { lockedBy: 1, lockExpiresAt: 1, appointment: 1 },
    });
  }

  appointment.status = 'CANCELLED';
  appointment.cancellationReason = reason;
  appointment.cancelledBy = new Types.ObjectId(cancelledByUserId);
  appointment.cancelledAt = new Date();
  await appointment.save();

  // Create notifications
  const notifyUserIds = [appointment.patient.toString(), appointment.doctor.toString()].filter(
    (id) => id !== cancelledByUserId
  );

  for (const id of notifyUserIds) {
    await Notification.create({
      user: id,
      title: 'Appointment Cancelled',
      message: `Appointment for ${appointment.appointmentDate} at ${appointment.startTime} was cancelled. Reason: ${reason}`,
      type: 'APPOINTMENT_CANCELLED',
      actionUrl: `/appointments`,
    });
  }

  await logAudit({
    actorId: cancelledByUserId,
    actorRole: userRole,
    action: 'APPOINTMENT_CANCELLED',
    targetResource: 'Appointment',
    targetId: appointment._id.toString(),
    details: { reason },
  });

  // Automatically check waitlist and trigger notifications for waitlisted patients!
  try {
    await checkAndNotifyWaitlist(
      appointment.doctor.toString(),
      appointment.appointmentDate,
      appointment.startTime,
      appointment.endTime
    );
  } catch (err) {
    console.error('[Waitlist Trigger Error]', err);
  }

  return appointment;
};

export const rescheduleAppointment = async (
  appointmentId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  userId: string,
  userRole: string
): Promise<IAppointment> => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found.');
  }

  const isPatient = appointment.patient.toString() === userId;
  const isDoctor = appointment.doctor.toString() === userId;
  const isAdminOrStaff = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(userRole);

  if (!isPatient && !isDoctor && !isAdminOrStaff) {
    throw new Error('You do not have permission to reschedule this appointment.');
  }

  // 1. Lock new slot first
  const newSlot = await atomicLockSlot(
    appointment.doctor.toString(),
    newDate,
    newStartTime,
    newEndTime,
    appointment.patient.toString()
  );

  // 2. Release old slot
  if (appointment.slot) {
    await AppointmentSlot.findByIdAndUpdate(appointment.slot, {
      status: 'AVAILABLE',
      $unset: { lockedBy: 1, lockExpiresAt: 1, appointment: 1 },
    });
  }

  // 3. Update appointment
  const oldDate = appointment.appointmentDate;
  const oldTime = appointment.startTime;

  appointment.appointmentDate = newDate;
  appointment.startTime = newStartTime;
  appointment.endTime = newEndTime;
  appointment.slot = newSlot._id;
  appointment.status = 'CONFIRMED';
  await appointment.save();

  newSlot.status = 'BOOKED';
  newSlot.appointment = appointment._id;
  await newSlot.save();

  await Notification.create({
    user: appointment.patient,
    title: 'Appointment Rescheduled',
    message: `Your appointment has been rescheduled from ${oldDate} ${oldTime} to ${newDate} at ${newStartTime}.`,
    type: 'APPOINTMENT_RESCHEDULED',
    actionUrl: `/appointments/${appointment._id}`,
  });

  await logAudit({
    actorId: userId,
    actorRole: userRole,
    action: 'APPOINTMENT_RESCHEDULED',
    targetResource: 'Appointment',
    targetId: appointment._id.toString(),
    details: { oldDate, oldTime, newDate, newStartTime },
  });

  return appointment;
};

