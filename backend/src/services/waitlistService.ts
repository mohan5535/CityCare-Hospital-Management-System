import { Types } from 'mongoose';
import { WaitlistEntry, IWaitlistEntry } from '../models/WaitlistEntry';
import { AppointmentSlot } from '../models/AppointmentSlot';
import { Notification } from '../models/Notification';
import { bookAppointment } from './bookingService';
import { logAudit } from '../utils/auditLogger';

export const joinWaitlist = async (
  patientId: string,
  doctorId: string,
  desiredDate: string,
  preferredTimeRange?: { start: string; end: string }
): Promise<IWaitlistEntry> => {
  // Check if already in waitlist for this doctor & date
  const existing = await WaitlistEntry.findOne({
    patient: patientId,
    doctor: doctorId,
    desiredDate,
    status: { $in: ['ACTIVE', 'OFFERED'] },
  });

  if (existing) {
    throw new Error('You are already on the active waitlist for this doctor on this date.');
  }

  const entry = await WaitlistEntry.create({
    patient: new Types.ObjectId(patientId),
    doctor: new Types.ObjectId(doctorId),
    desiredDate,
    preferredTimeRange: preferredTimeRange || { start: '09:00', end: '17:00' },
    status: 'ACTIVE',
  });

  await Notification.create({
    user: patientId,
    title: 'Waitlist Registered',
    message: `You have been added to the waitlist for Dr. on ${desiredDate}. You will be notified immediately when a slot opens.`,
    type: 'WAITLIST_OFFER',
  });

  return entry;
};

// Called when an appointment is cancelled: finds the top priority waitlist patient and creates a time-limited offer
export const checkAndNotifyWaitlist = async (
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<any> => {
  // Clean up any expired offers first
  const now = new Date();
  await WaitlistEntry.updateMany(
    {
      status: 'OFFERED',
      offerExpiresAt: { $lt: now },
    },
    {
      $set: { status: 'EXPIRED' },
    }
  );

  // Find next active waitlist entry with highest priority and earliest registration
  const nextCandidate = await WaitlistEntry.findOne({
    doctor: new Types.ObjectId(doctorId),
    desiredDate: date,
    status: 'ACTIVE',
  }).sort({ priority: -1, createdAt: 1 });

  if (!nextCandidate) {
    return null;
  }

  // 15-minute exclusive claim window
  const offerExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  nextCandidate.status = 'OFFERED';
  nextCandidate.offerExpiresAt = offerExpiresAt;
  nextCandidate.notificationSentAt = now;
  await nextCandidate.save();

  // Notify patient
  await Notification.create({
    user: nextCandidate.patient,
    title: 'Waitlist Slot Available!',
    message: `A slot on ${date} at ${startTime} has opened up! You have 15 minutes to claim it before it is offered to the next patient.`,
    type: 'WAITLIST_OFFER',
    actionUrl: `/appointments/claim-waitlist?waitlistId=${nextCandidate._id}&date=${date}&startTime=${startTime}&endTime=${endTime}`,
    metadata: {
      waitlistId: nextCandidate._id,
      doctorId,
      date,
      startTime,
      endTime,
      expiresAt: offerExpiresAt,
    },
  });

  return nextCandidate;
};

// Claim the offered slot atomically
export const claimWaitlistSlot = async (
  waitlistId: string,
  patientId: string,
  startTime: string,
  endTime: string,
  reasonForVisit: string
): Promise<any> => {
  const now = new Date();
  const entry = await WaitlistEntry.findOne({
    _id: waitlistId,
    patient: patientId,
    status: 'OFFERED',
    offerExpiresAt: { $gt: now },
  });

  if (!entry) {
    throw new Error('This waitlist offer has expired or is no longer available.');
  }

  // Book appointment
  const appointment = await bookAppointment({
    patientId,
    doctorId: entry.doctor.toString(),
    appointmentDate: entry.desiredDate,
    startTime,
    endTime,
    reasonForVisit: reasonForVisit || 'Waitlist claimed appointment',
  });

  entry.status = 'CLAIMED';
  await entry.save();

  return appointment;
};

