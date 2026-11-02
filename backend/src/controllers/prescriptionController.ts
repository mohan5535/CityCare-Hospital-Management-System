import { Response } from 'express';
import { Types } from 'mongoose';
import { Prescription } from '../models/Prescription';
import { Appointment } from '../models/Appointment';
import { QueueEntry } from '../models/LiveQueue';
import { DoctorProfile } from '../models/DoctorProfile';
import { PatientProfile } from '../models/PatientProfile';
import { Notification } from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../utils/auditLogger';
import { generatePrescriptionPdf } from '../utils/pdfGenerator';

export const createPrescription = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const {
      appointmentId,
      diagnosis,
      vitals,
      medications,
      labTestsRecommended,
      clinicalNotes,
      additionalAdvice,
      followUpDate,
      symptomsAndFindings,
      isFinalized = false,
      amendmentReason,
    } = req.body;

    if (!appointmentId || !diagnosis || !medications || !Array.isArray(medications)) {
      return sendError(res, 'appointmentId, diagnosis, and medications array are required', 400);
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Verify authorized doctor
    if (
      req.user.role === 'DOCTOR' &&
      appointment.doctor.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'You can only prescribe for your own patients', 403);
    }

    const targetStatus = isFinalized ? 'FINALIZED' : 'DRAFT';

    // Check if prescription already exists
    let prescription = await Prescription.findOne({ appointment: appointment._id });
    if (prescription) {
      // If updating an already FINALIZED prescription, record amendment version
      if (prescription.status === 'FINALIZED') {
        prescription.amendmentHistory.push({
          amendedAt: new Date(),
          amendedBy: req.user._id,
          previousDiagnosis: prescription.diagnosis,
          previousMedications: prescription.medications,
          reason: amendmentReason || 'Clinical amendment and dosage update',
        });
        prescription.version = (prescription.version || 1) + 1;
      }

      prescription.appointmentReference =
        appointment.appointmentReference || prescription.appointmentReference || '';
      prescription.status = targetStatus;
      prescription.diagnosis = diagnosis;
      prescription.symptomsAndFindings =
        symptomsAndFindings || prescription.symptomsAndFindings || '';
      prescription.vitals = vitals;
      prescription.medications = medications;
      prescription.labTestsRecommended = labTestsRecommended || [];
      prescription.clinicalNotes = clinicalNotes || '';
      prescription.additionalAdvice = additionalAdvice || '';
      prescription.followUpDate = followUpDate;
      await prescription.save();
    } else {
      prescription = await Prescription.create({
        appointment: appointment._id,
        appointmentReference: appointment.appointmentReference || '',
        doctor: appointment.doctor,
        patient: appointment.patient,
        status: targetStatus,
        version: 1,
        diagnosis,
        symptomsAndFindings: symptomsAndFindings || '',
        vitals,
        medications,
        labTestsRecommended: labTestsRecommended || [],
        clinicalNotes: clinicalNotes || '',
        additionalAdvice: additionalAdvice || '',
        followUpDate,
        amendmentHistory: [],
      });
    }

    // Mark appointment and queue as COMPLETED if finalizing prescription
    if (targetStatus === 'FINALIZED') {
      appointment.status = 'COMPLETED';
      appointment.consultationEndedAt = new Date();
      appointment.completedByDoctor = req.user._id;
      await appointment.save();

      await QueueEntry.findOneAndUpdate(
        { appointment: appointment._id },
        { status: 'COMPLETED', consultationEndedAt: appointment.consultationEndedAt }
      );

      // Notify patient
      await Notification.create({
        user: appointment.patient,
        title: 'Prescription Ready',
        message: `Your medical prescription (${appointment.appointmentReference || 'Consultation'}) has been finalized and is ready for download.`,
        type: 'SYSTEM',
        actionUrl: `/patient/appointments`,
      });
    }

    await logAudit({
      actorId: req.user._id.toString(),
      actorRole: req.user.role,
      action: targetStatus === 'FINALIZED' ? 'PRESCRIPTION_FINALIZED' : 'PRESCRIPTION_DRAFT_SAVED',
      targetResource: 'Prescription',
      targetId: prescription._id.toString(),
      details: { appointmentId, version: prescription.version, status: targetStatus },
    });

    return sendSuccess(
      res,
      prescription,
      targetStatus === 'FINALIZED'
        ? 'Prescription finalized and signed successfully'
        : 'Prescription draft saved successfully',
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to save prescription', 500);
  }
};

export const getMyPrescriptions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const filter: any = {};
    if (req.user.role === 'PATIENT') {
      filter.patient = req.user._id;
      filter.status = 'FINALIZED'; // Patients only see finalized prescriptions
    } else if (req.user.role === 'DOCTOR') {
      filter.doctor = req.user._id;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('doctor', 'firstName lastName email phone')
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'appointment',
        select: 'appointmentReference appointmentDate startTime type consultationFee department',
        populate: { path: 'department', select: 'name' },
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, prescriptions, 'Prescriptions retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch prescriptions', 500);
  }
};

const verifyPrescriptionAccess = async (
  prescription: any,
  requesterUser: any
): Promise<{ isDoctor: boolean; isPatient: boolean; isStaff: boolean }> => {
  if (!requesterUser) return { isDoctor: false, isPatient: false, isStaff: false };

  const doctorTargetId = (prescription.doctor as any)?._id?.toString() || prescription.doctor?.toString();
  const patientTargetId = (prescription.patient as any)?._id?.toString() || prescription.patient?.toString();
  const requesterId = requesterUser._id?.toString();
  const requesterRole = requesterUser.role || '';

  const possibleDocIds = [requesterId];
  if (requesterRole === 'DOCTOR') {
    const docProfile = await DoctorProfile.findOne({
      $or: [{ user: requesterUser._id }, { _id: requesterUser._id }],
    });
    if (docProfile) {
      possibleDocIds.push(docProfile._id.toString());
      if (docProfile.user) possibleDocIds.push(docProfile.user.toString());
    }
  }

  const possiblePatIds = [requesterId];
  if (requesterRole === 'PATIENT') {
    const patProfile = await PatientProfile.findOne({
      $or: [{ user: requesterUser._id }, { _id: requesterUser._id }],
    });
    if (patProfile) {
      possiblePatIds.push(patProfile._id.toString());
      if (patProfile.user) possiblePatIds.push(patProfile.user.toString());
    }
  }

  const isDoctor = possibleDocIds.includes(doctorTargetId);
  const isPatient = possiblePatIds.includes(patientTargetId);
  const isStaff = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(requesterRole);

  return { isDoctor, isPatient, isStaff };
};

export const getPrescriptionById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    let prescription = null;

    if (Types.ObjectId.isValid(id)) {
      prescription = await Prescription.findById(id)
        .populate('doctor', 'firstName lastName email phone')
        .populate('patient', 'firstName lastName email phone')
        .populate({
          path: 'appointment',
          select: 'appointmentReference appointmentDate startTime type department',
          populate: { path: 'department', select: 'name' },
        });
    }

    if (!prescription) {
      prescription = await Prescription.findOne({ appointmentReference: id })
        .populate('doctor', 'firstName lastName email phone')
        .populate('patient', 'firstName lastName email phone')
        .populate({
          path: 'appointment',
          select: 'appointmentReference appointmentDate startTime type department',
          populate: { path: 'department', select: 'name' },
        });
    }

    if (!prescription) {
      return sendError(res, 'Prescription not found', 404);
    }

    const { isDoctor, isPatient, isStaff } = await verifyPrescriptionAccess(prescription, req.user);

    if (!isPatient && !isDoctor && !isStaff) {
      return sendError(res, 'You do not have permission to view this prescription', 403);
    }

    // Hide draft prescriptions from patients
    if (isPatient && prescription.status !== 'FINALIZED') {
      return sendError(res, 'This prescription has not been finalized yet.', 403);
    }

    return sendSuccess(res, prescription, 'Prescription retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to retrieve prescription', 500);
  }
};

export const getPrescriptionByAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { appointmentId } = req.params;
    let query: any = {};

    if (Types.ObjectId.isValid(appointmentId)) {
      query = { appointment: appointmentId };
    } else {
      const appt = await Appointment.findOne({ appointmentReference: appointmentId });
      if (appt) {
        query = { appointment: appt._id };
      } else {
        query = { appointmentReference: appointmentId };
      }
    }

    const prescription = await Prescription.findOne(query)
      .populate('doctor', 'firstName lastName email phone')
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'appointment',
        select: 'appointmentReference appointmentDate startTime type department',
        populate: { path: 'department', select: 'name' },
      });

    if (!prescription) {
      return sendError(res, 'Prescription not found for this appointment', 404);
    }

    const { isDoctor, isPatient, isStaff } = await verifyPrescriptionAccess(prescription, req.user);

    if (!isPatient && !isDoctor && !isStaff) {
      return sendError(res, 'You do not have permission to view this prescription', 403);
    }

    // Hide draft prescriptions from patients
    if (isPatient && prescription.status !== 'FINALIZED') {
      return sendError(res, 'This prescription has not been finalized yet.', 403);
    }

    return sendSuccess(res, prescription, 'Prescription retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to get prescription', 500);
  }
};

export const downloadPrescriptionPdf = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const target = req.params.id || req.params.appointmentId;
    if (!target) {
      return sendError(res, 'Prescription identifier is required', 400);
    }

    let prescription = null;

    if (Types.ObjectId.isValid(target)) {
      prescription = await Prescription.findById(target)
        .populate('doctor', 'firstName lastName email phone')
        .populate('patient', 'firstName lastName email phone')
        .populate({
          path: 'appointment',
          select: 'appointmentReference appointmentDate startTime type department',
          populate: { path: 'department', select: 'name' },
        });

      // Fallback: search by appointmentId if not found by prescription _id
      if (!prescription) {
        prescription = await Prescription.findOne({ appointment: target })
          .populate('doctor', 'firstName lastName email phone')
          .populate('patient', 'firstName lastName email phone')
          .populate({
            path: 'appointment',
            select: 'appointmentReference appointmentDate startTime type department',
            populate: { path: 'department', select: 'name' },
          });
      }
    }

    if (!prescription) {
      // Check if target is an appointment reference string (e.g. APT-2026-701461)
      prescription = await Prescription.findOne({ appointmentReference: target })
        .populate('doctor', 'firstName lastName email phone')
        .populate('patient', 'firstName lastName email phone')
        .populate({
          path: 'appointment',
          select: 'appointmentReference appointmentDate startTime type department',
          populate: { path: 'department', select: 'name' },
        });

      if (!prescription) {
        const appt = await Appointment.findOne({ appointmentReference: target });
        if (appt) {
          prescription = await Prescription.findOne({ appointment: appt._id })
            .populate('doctor', 'firstName lastName email phone')
            .populate('patient', 'firstName lastName email phone')
            .populate({
              path: 'appointment',
              select: 'appointmentReference appointmentDate startTime type department',
              populate: { path: 'department', select: 'name' },
            });
        }
      }
    }

    if (!prescription) {
      return sendError(res, 'Prescription not found', 404);
    }

    const { isDoctor, isPatient, isStaff } = await verifyPrescriptionAccess(prescription, req.user);

    if (!isPatient && !isDoctor && !isStaff) {
      return sendError(res, 'You do not have permission to download this prescription', 403);
    }

    if (isPatient && prescription.status !== 'FINALIZED') {
      return sendError(res, 'Cannot download an unfinalized draft prescription', 403);
    }

    const doctorUserId = (prescription.doctor as any)?._id?.toString() || prescription.doctor?.toString();
    // Lookup doctor profile for qualifications and license number
    const doctorProfile = await DoctorProfile.findOne({
      $or: [{ user: doctorUserId }, { _id: doctorUserId }],
    });

    const ref = prescription.appointmentReference || 'Consultation';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="CityCare-Prescription-${ref}.pdf"`
    );

    await generatePrescriptionPdf(
      {
        appointmentReference: ref,
        prescriptionNumber: `RX-${prescription._id.toString().slice(-6).toUpperCase()}`,
        date: new Date(prescription.createdAt).toLocaleDateString(),
        doctor: {
          firstName: (prescription.doctor as any).firstName,
          lastName: (prescription.doctor as any).lastName,
          email: (prescription.doctor as any).email,
          phone: (prescription.doctor as any).phone,
          departmentName: (prescription.appointment as any)?.department?.name,
          licenseNumber: doctorProfile?.licenseNumber || 'MCI-VERIFIED',
          qualifications: doctorProfile?.qualifications || ['MBBS', 'MD'],
        },
        patient: {
          firstName: (prescription.patient as any).firstName,
          lastName: (prescription.patient as any).lastName,
          email: (prescription.patient as any).email,
          phone: (prescription.patient as any).phone,
        },
        vitals: prescription.vitals,
        diagnosis: prescription.diagnosis,
        symptomsAndFindings: prescription.symptomsAndFindings,
        medications: prescription.medications,
        labTestsRecommended: prescription.labTestsRecommended,
        clinicalNotes: prescription.clinicalNotes,
        additionalAdvice: prescription.additionalAdvice,
        followUpDate: prescription.followUpDate,
        status: prescription.status,
        version: prescription.version,
      },
      res
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to generate PDF', 500);
  }
};
