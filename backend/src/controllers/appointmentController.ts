import { Response } from 'express';
import { Appointment } from '../models/Appointment';
import { QueueEntry } from '../models/LiveQueue';
import { Prescription } from '../models/Prescription';
import { Notification } from '../models/Notification';
import { DoctorProfile } from '../models/DoctorProfile';
import { PatientProfile } from '../models/PatientProfile';
import {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from '../services/bookingService';
import { checkInAppointment } from '../services/queueService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../utils/auditLogger';

export const createAppointment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const patientId = req.user.role === 'PATIENT' ? req.user._id.toString() : req.body.patientId;
    if (!patientId) {
      return sendError(res, 'Patient ID is required', 400);
    }

    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      type,
      reasonForVisit,
      symptomsSummary,
      idempotencyKey,
    } = req.body;

    const appointment = await bookAppointment({
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      type,
      reasonForVisit,
      symptomsSummary,
      idempotencyKey,
    });

    return sendSuccess(res, appointment, 'Appointment successfully booked', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to book appointment', 400);
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { status, date, scope, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (req.user.role === 'PATIENT') {
      const patientProfile = await PatientProfile.findOne({
        $or: [{ user: req.user._id }, { _id: req.user._id }],
      });
      const patIds: any[] = [req.user._id];
      if (patientProfile) {
        patIds.push(patientProfile._id);
        if (patientProfile.user) patIds.push(patientProfile.user);
      }
      filter.patient = { $in: patIds };
    } else if (req.user.role === 'DOCTOR') {
      const doctorProfile = await DoctorProfile.findOne({
        $or: [{ user: req.user._id }, { _id: req.user._id }],
      });
      const docIds: any[] = [req.user._id];
      if (doctorProfile) {
        docIds.push(doctorProfile._id);
        if (doctorProfile.user) docIds.push(doctorProfile.user);
      }
      filter.doctor = { $in: docIds };
    }

    // Status filtering (support comma separated or single)
    if (status) {
      const statusStr = status as string;
      if (statusStr.includes(',')) {
        filter.status = { $in: statusStr.split(',').map((s) => s.trim()) };
      } else {
        filter.status = statusStr;
      }
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const localToday = `${yyyy}-${mm}-${dd}`;
    const utcToday = now.toISOString().slice(0, 10);

    // Scope or date filtering
    if (date) {
      filter.appointmentDate = date;
    } else if (scope === 'today') {
      filter.$or = [{ appointmentDate: localToday }, { appointmentDate: utcToday }];
    } else if (scope === 'upcoming') {
      filter.appointmentDate = { $gte: localToday };
    } else if (scope === 'past') {
      filter.appointmentDate = { $lt: localToday };
    }

    // Appointment reference or reason search
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      const searchConditions = [
        { appointmentReference: searchRegex },
        { reasonForVisit: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone')
      .populate('department', 'name slug icon')
      .skip(skip)
      .limit(limitNum)
      .sort({ appointmentDate: scope === 'past' ? -1 : 1, startTime: scope === 'past' ? -1 : 1 });

    // Look up associated prescriptions so client has instant, authoritative status
    const appointmentIds = appointments.map((a) => a._id);
    const rxFilter: any = { appointment: { $in: appointmentIds } };
    if (req.user.role === 'PATIENT') {
      rxFilter.status = 'FINALIZED'; // Patients only see finalized prescriptions
    }

    const prescriptions = await Prescription.find(rxFilter).select(
      'appointment status version diagnosis followUpDate createdAt'
    );

    const prescriptionMap = new Map();
    prescriptions.forEach((p) => {
      if (p.appointment) {
        prescriptionMap.set(p.appointment.toString(), {
          _id: p._id,
          status: p.status,
          version: p.version,
          diagnosis: p.diagnosis,
          followUpDate: p.followUpDate,
          createdAt: p.createdAt,
        });
      }
    });

    const appointmentsWithRx = appointments.map((appt) => {
      const apptObj: any = appt.toObject();
      apptObj.prescription = prescriptionMap.get(appt._id.toString()) || null;
      return apptObj;
    });

    return sendSuccess(res, appointmentsWithRx, 'Appointments retrieved', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch appointments', 500);
  }
};

export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone')
      .populate('department', 'name slug icon');

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Authorization: patient, doctor, or staff
    const isOwner =
      req.user?._id.toString() === appointment.patient._id.toString() ||
      req.user?._id.toString() === appointment.doctor._id.toString();
    const isStaff = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(
      req.user?.role || ''
    );

    if (!isOwner && !isStaff) {
      return sendError(res, 'You do not have permission to view this appointment', 403);
    }

    const apptObj: any = appointment.toObject();
    const rxFilter: any = { appointment: appointment._id };
    if (req.user?.role === 'PATIENT') {
      rxFilter.status = 'FINALIZED';
    }
    const prescription = await Prescription.findOne(rxFilter);
    apptObj.prescription = prescription;

    return sendSuccess(res, apptObj, 'Appointment details retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to get appointment', 500);
  }
};

export const checkInAppointmentHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor.toString() === req.user._id.toString();
    const isStaff = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(req.user.role);

    if (!isPatient && !isDoctor && !isStaff) {
      return sendError(res, 'You do not have permission to check in this appointment', 403);
    }

    if (appointment.status === 'CANCELLED') {
      return sendError(res, 'Cannot check in a cancelled appointment', 400);
    }

    const entry = await checkInAppointment(appointment._id.toString());
    return sendSuccess(res, entry, 'Patient checked in successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to check in appointment', 400);
  }
};

export const startConsultationHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Authorization: only the assigned doctor or admin
    if (req.user.role === 'DOCTOR' && appointment.doctor.toString() !== req.user._id.toString()) {
      return sendError(res, 'You are not authorized to start consultations for this patient', 403);
    }
    if (!['DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role)) {
      return sendError(res, 'Permission denied', 403);
    }

    if (appointment.status === 'CANCELLED') {
      return sendError(res, 'Cannot start consultation on a cancelled appointment', 400);
    }

    appointment.status = 'IN_CONSULTATION';
    appointment.consultationStartedAt = new Date();
    await appointment.save();

    // Update OPD Queue Entry if present
    await QueueEntry.findOneAndUpdate(
      { appointment: appointment._id },
      { status: 'IN_CONSULTATION', consultationStartedAt: appointment.consultationStartedAt }
    );

    // Notify patient
    await Notification.create({
      user: appointment.patient,
      title: 'Consultation Started',
      message: 'Your doctor consultation has begun.',
      type: 'APPOINTMENT_CONFIRMED',
      actionUrl: `/patient/appointments`,
    });

    await logAudit({
      actorId: req.user._id.toString(),
      actorRole: req.user.role,
      action: 'CONSULTATION_STARTED',
      targetResource: 'Appointment',
      targetId: appointment._id.toString(),
      details: { doctorId: appointment.doctor.toString() },
    });

    return sendSuccess(res, appointment, 'Consultation started successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to start consultation', 500);
  }
};

export const completeConsultationHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { id } = req.params;
    const { notes } = req.body;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (req.user.role === 'DOCTOR' && appointment.doctor.toString() !== req.user._id.toString()) {
      return sendError(res, 'You are not authorized to complete consultations for this patient', 403);
    }
    if (!['DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role)) {
      return sendError(res, 'Permission denied', 403);
    }

    if (appointment.status === 'CANCELLED') {
      return sendError(res, 'Cannot complete a cancelled appointment', 400);
    }

    appointment.status = 'COMPLETED';
    appointment.consultationEndedAt = new Date();
    appointment.completedByDoctor = req.user._id;
    if (notes) {
      appointment.consultationNotes = notes;
    }
    await appointment.save();

    // Update OPD Queue Entry if present
    await QueueEntry.findOneAndUpdate(
      { appointment: appointment._id },
      { status: 'COMPLETED', consultationEndedAt: appointment.consultationEndedAt }
    );

    await Notification.create({
      user: appointment.patient,
      title: 'Consultation Completed',
      message: 'Your consultation is complete. You can view your clinical records and prescription.',
      type: 'SYSTEM',
      actionUrl: `/patient/appointments`,
    });

    await logAudit({
      actorId: req.user._id.toString(),
      actorRole: req.user.role,
      action: 'CONSULTATION_COMPLETED',
      targetResource: 'Appointment',
      targetId: appointment._id.toString(),
      details: { doctorId: appointment.doctor.toString() },
    });

    return sendSuccess(res, appointment, 'Consultation completed successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to complete consultation', 500);
  }
};

export const cancelAppointmentHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;

    const appointment = await cancelAppointment(
      id,
      req.user._id.toString(),
      req.user.role,
      reason
    );

    return sendSuccess(res, appointment, 'Appointment cancelled successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to cancel appointment', 400);
  }
};

export const rescheduleAppointmentHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { id } = req.params;
    const { newDate, newStartTime, newEndTime } = req.body;

    if (!newDate || !newStartTime || !newEndTime) {
      return sendError(res, 'newDate, newStartTime, and newEndTime are required', 400);
    }

    const appointment = await rescheduleAppointment(
      id,
      newDate,
      newStartTime,
      newEndTime,
      req.user._id.toString(),
      req.user.role
    );

    return sendSuccess(res, appointment, 'Appointment rescheduled successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to reschedule appointment', 400);
  }
};

export const getAllAppointmentsAdmin = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { doctorId, patientId, status, date, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (doctorId) filter.doctor = doctorId;
    if (patientId) filter.patient = patientId;
    if (status) filter.status = status;
    if (date) filter.appointmentDate = date;

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone')
      .populate('department', 'name slug')
      .skip(skip)
      .limit(limitNum)
      .sort({ appointmentDate: -1, startTime: -1 });

    return sendSuccess(res, appointments, 'Admin appointments list retrieved', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch appointments', 500);
  }
};
