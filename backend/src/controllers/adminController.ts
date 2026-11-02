import { Response } from 'express';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { Appointment } from '../models/Appointment';
import { Payment } from '../models/Payment';
import { AuditLog } from '../models/AuditLog';
import { getTodayDateString } from '../services/queueService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const today = getTodayDateString();

    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      todayAppointments,
      totalRevenue,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ role: 'PATIENT' }),
      DoctorProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
      DoctorProfile.countDocuments({ verificationStatus: 'PENDING' }),
      Appointment.countDocuments({ appointmentDate: today }),
      Payment.aggregate([
        { $match: { status: 'CAPTURED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const stats = {
      totalPatients,
      totalDoctors,
      pendingDoctors,
      todayAppointments,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentAuditLogs,
    };

    return sendSuccess(res, stats, 'Admin dashboard statistics retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch admin stats', 500);
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { action, actorRole, targetResource, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (action) filter.action = action;
    if (actorRole) filter.actorRole = actorRole;
    if (targetResource) filter.targetResource = targetResource;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('actor', 'firstName lastName email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    return sendSuccess(res, logs, 'Audit logs retrieved', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch audit logs', 500);
  }
};

