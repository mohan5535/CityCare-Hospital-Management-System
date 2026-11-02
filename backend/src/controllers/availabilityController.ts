import { Request, Response } from 'express';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { AppointmentSlot } from '../models/AppointmentSlot';
import { getOrGenerateSlotsForDate } from '../services/slotService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { Types } from 'mongoose';
import { resolveDoctorIdentifier } from '../utils/doctorResolver';

export const setWeeklySchedule = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.role === 'DOCTOR' ? req.user._id.toString() : req.body.doctorId;
    if (!doctorId) {
      return sendError(res, 'Doctor ID is required', 400);
    }

    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime, slotDurationMinutes, breakTimes, isDayOff }
    if (!Array.isArray(schedules)) {
      return sendError(res, 'Schedules must be an array', 400);
    }

    const savedSchedules = [];
    for (const item of schedules) {
      const schedule = await DoctorAvailability.findOneAndUpdate(
        { doctor: new Types.ObjectId(doctorId), dayOfWeek: item.dayOfWeek },
        {
          startTime: item.startTime,
          endTime: item.endTime,
          slotDurationMinutes: item.slotDurationMinutes || 30,
          breakTimes: item.breakTimes || [],
          isDayOff: !!item.isDayOff,
        },
        { upsert: true, new: true }
      );
      savedSchedules.push(schedule);
    }

    return sendSuccess(res, savedSchedules, 'Weekly schedules updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update schedule', 500);
  }
};

export const getDoctorSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { doctorId } = req.params;
    const resolved = await resolveDoctorIdentifier(doctorId);
    const targetId = resolved ? resolved.userId : doctorId;

    const schedules = await DoctorAvailability.find({ doctor: targetId }).sort({ dayOfWeek: 1 });
    return sendSuccess(res, schedules, 'Doctor schedules retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to get doctor schedules', 500);
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<any> => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return sendError(res, 'Both doctorId and date (YYYY-MM-DD) are required query parameters', 400);
    }

    const resolved = await resolveDoctorIdentifier(doctorId as string);
    const targetId = resolved ? resolved.userId.toString() : (doctorId as string);

    const slots = await getOrGenerateSlotsForDate(targetId, date as string);
    return sendSuccess(res, slots, 'Available slots retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to retrieve available slots', 500);
  }
};

export const blockSlot = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;
    const targetDoctor = req.user?.role === 'DOCTOR' ? req.user._id.toString() : doctorId;

    const slot = await AppointmentSlot.findOneAndUpdate(
      { doctor: new Types.ObjectId(targetDoctor), date, startTime },
      {
        endTime,
        status: 'BLOCKED',
      },
      { upsert: true, new: true }
    );

    return sendSuccess(res, slot, 'Slot blocked successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to block slot', 500);
  }
};

