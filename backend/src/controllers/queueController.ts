import { Request, Response } from 'express';
import {
  checkInAppointment,
  updateTokenStatus,
  getDoctorPublicQueue,
  getDoctorClinicalQueue,
  recordDoctorDelay,
  getTodayDateString,
} from '../services/queueService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const checkIn = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return sendError(res, 'appointmentId is required', 400);
    }
    const entry = await checkInAppointment(appointmentId);
    return sendSuccess(res, entry, 'Patient checked in successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Check-in failed', 400);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { entryId } = req.params;
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', 400);
    }
    const entry = await updateTokenStatus(entryId, status, req.user?._id.toString() || '');
    return sendSuccess(res, entry, `Token status updated to ${status}`);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update token status', 400);
  }
};

export const recordDelay = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId =
      req.user?.role === 'DOCTOR' ? req.user._id.toString() : req.body.doctorId;
    if (!doctorId) {
      return sendError(res, 'Doctor ID is required', 400);
    }
    const { delayMinutes, reason, date } = req.body;
    if (typeof delayMinutes !== 'number') {
      return sendError(res, 'delayMinutes number is required', 400);
    }
    const queue = await recordDoctorDelay(
      doctorId,
      delayMinutes,
      reason || '',
      date || getTodayDateString()
    );
    return sendSuccess(res, queue, 'Doctor delay recorded and updated');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to record delay', 400);
  }
};

export const getPublicQueue = async (req: Request, res: Response): Promise<any> => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const result = await getDoctorPublicQueue(doctorId, (date as string) || getTodayDateString());
    return sendSuccess(res, result, 'Queue status retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch queue', 500);
  }
};

export const getClinicalQueue = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId =
      req.user?.role === 'DOCTOR' ? req.user._id.toString() : (req.query.doctorId as string);
    if (!doctorId) {
      return sendError(res, 'Doctor ID is required', 400);
    }
    const { date } = req.query;
    const result = await getDoctorClinicalQueue(doctorId, (date as string) || getTodayDateString());
    return sendSuccess(res, result, 'Clinical queue retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch clinical queue', 500);
  }
};

