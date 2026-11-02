import { Response } from 'express';
import {
  joinWaitlist,
  claimWaitlistSlot,
} from '../services/waitlistService';
import { WaitlistEntry } from '../models/WaitlistEntry';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const join = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const { doctorId, desiredDate, preferredTimeRange } = req.body;
    if (!doctorId || !desiredDate) {
      return sendError(res, 'doctorId and desiredDate are required', 400);
    }

    const entry = await joinWaitlist(
      req.user._id.toString(),
      doctorId,
      desiredDate,
      preferredTimeRange
    );
    return sendSuccess(res, entry, 'Joined waitlist successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to join waitlist', 400);
  }
};

export const claim = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const { waitlistId, startTime, endTime, reasonForVisit } = req.body;
    if (!waitlistId || !startTime || !endTime) {
      return sendError(res, 'waitlistId, startTime, and endTime are required', 400);
    }

    const appointment = await claimWaitlistSlot(
      waitlistId,
      req.user._id.toString(),
      startTime,
      endTime,
      reasonForVisit
    );
    return sendSuccess(res, appointment, 'Waitlist slot claimed successfully', 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to claim waitlist slot', 400);
  }
};

export const getMyWaitlist = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const entries = await WaitlistEntry.find({ patient: req.user._id })
      .populate('doctor', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, entries, 'Waitlist entries retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to get waitlist entries', 500);
  }
};

