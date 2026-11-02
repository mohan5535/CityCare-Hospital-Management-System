import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { DoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../utils/auditLogger';
import { resolveDoctorIdentifier } from '../utils/doctorResolver';

export const searchDoctors = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      search,
      departmentId,
      departmentSlug,
      maxFee,
      minRating,
      teleconsultation,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {
      verificationStatus: 'VERIFIED',
    };

    if (departmentId && Types.ObjectId.isValid(departmentId as string)) {
      filter.department = new Types.ObjectId(departmentId as string);
    } else if (departmentSlug && (departmentSlug as string).trim()) {
      const cleanSlug = (departmentSlug as string).trim();
      const escapedSlug = cleanSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const dept = await Department.findOne({
        slug: { $regex: new RegExp(`^${escapedSlug}$`, 'i') },
      });
      if (dept) {
        filter.department = dept._id;
      } else {
        // Explicitly set an unmatchable ObjectId so non-existent department returns 0 results
        filter.department = new Types.ObjectId();
      }
    }

    if (maxFee) {
      const feeNum = Number(maxFee);
      if (!isNaN(feeNum)) {
        filter.consultationFee = { $lte: feeNum };
      }
    }

    if (minRating) {
      const ratingNum = Number(minRating);
      if (!isNaN(ratingNum)) {
        filter.averageRating = { $gte: ratingNum };
      }
    }

    if (teleconsultation !== undefined && teleconsultation !== '') {
      filter.teleconsultationEnabled = teleconsultation === 'true';
    }

    if (search && (search as string).trim()) {
      const cleanSearch = (search as string).trim();
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      // 1. Search matching users by first name, last name, or combined full name
      const userMatches = await User.find({
        role: 'DOCTOR',
        $or: [
          { firstName: regex },
          { lastName: regex },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$firstName', ' ', '$lastName'] },
                regex: escaped,
                options: 'i',
              },
            },
          },
        ],
      }).select('_id');
      const userIds = userMatches.map((u) => u._id);

      // 2. Search matching departments
      const matchingDepts = await Department.find({
        $or: [{ name: regex }, { slug: regex }],
      }).select('_id');
      const deptIds = matchingDepts.map((d) => d._id);

      // 3. Search criteria across practitioner attributes
      filter.$or = [
        { user: { $in: userIds } },
        { department: { $in: deptIds } },
        { specialization: regex },
        { qualifications: regex },
        { bio: regex },
      ];
    }

    const total = await DoctorProfile.countDocuments(filter);
    const doctors = await DoctorProfile.find(filter)
      .populate('user', 'firstName lastName email phone status profilePhoto')
      .populate('department', 'name slug icon description')
      .skip(skip)
      .limit(limitNum)
      .sort({ averageRating: -1, experienceYears: -1 });

    // Filter out orphaned profiles where user was deleted or suspended
    const validDoctors = doctors.filter(
      (doc) => doc.user && (doc.user as any).status !== 'SUSPENDED'
    );

    return sendSuccess(res, validDoctors, 'Doctors retrieved successfully', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to search doctors', 500);
  }
};

export const getDoctorById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const resolved = await resolveDoctorIdentifier(id);

    let doctor: any = null;
    if (resolved && resolved.doctorProfile) {
      doctor = await DoctorProfile.findById(resolved.doctorProfile._id)
        .populate('user', 'firstName lastName email phone')
        .populate('department', 'name slug icon');
    } else if (resolved) {
      doctor = await DoctorProfile.findOne({ user: resolved.userId })
        .populate('user', 'firstName lastName email phone')
        .populate('department', 'name slug icon');
    }

    if (!doctor) {
      return sendError(res, 'Doctor not found', 404);
    }

    return sendSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to get doctor', 500);
  }
};

export const getAllDoctorsAdmin = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status) {
      filter.verificationStatus = status;
    }

    if (search) {
      const regex = new RegExp(search as string, 'i');
      const users = await User.find({
        role: 'DOCTOR',
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
      }).select('_id');
      const userIds = users.map((u) => u._id);

      filter.$or = [
        { user: { $in: userIds } },
        { licenseNumber: regex },
        { specialization: { $in: [regex] } },
      ];
    }

    const total = await DoctorProfile.countDocuments(filter);
    const doctors = await DoctorProfile.find(filter)
      .populate('user', 'firstName lastName email phone status lastLogin')
      .populate('department', 'name slug')
      .populate('verifiedBy', 'firstName lastName')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    return sendSuccess(res, doctors, 'All doctors retrieved for administration', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to get doctors', 500);
  }
};

export const verifyDoctor = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return sendError(res, 'Status must be either VERIFIED or REJECTED', 400);
    }

    const doctor = await DoctorProfile.findById(id);
    if (!doctor) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    doctor.verificationStatus = status;
    doctor.verifiedBy = req.user?._id;
    doctor.verifiedAt = new Date();
    if (status === 'REJECTED') {
      doctor.rejectionReason = rejectionReason || 'Qualifications not met';
    } else {
      doctor.rejectionReason = undefined;
      // Activate user account
      await User.findByIdAndUpdate(doctor.user, { status: 'ACTIVE' });
    }

    await doctor.save();

    await logAudit({
      req,
      actorId: req.user?._id.toString(),
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'ADMIN',
      action: status === 'VERIFIED' ? 'DOCTOR_VERIFIED' : 'DOCTOR_REJECTED',
      targetResource: 'DoctorProfile',
      targetId: doctor._id.toString(),
      details: { doctorId: id, status, rejectionReason },
    });

    return sendSuccess(res, doctor, `Doctor status updated to ${status}`);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to verify doctor', 500);
  }
};

export const updateDoctorProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    let doctor: any;
    if (req.user?.role === 'DOCTOR') {
      doctor = await DoctorProfile.findOne({ user: req.user._id });
    } else {
      // Admin updating
      doctor = await DoctorProfile.findById(req.params.id);
    }

    if (!doctor) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const { consultationFee, bio, specialization, qualifications, experienceYears, teleconsultationEnabled, departmentId } = req.body;

    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (bio !== undefined) doctor.bio = bio;
    if (specialization) doctor.specialization = specialization;
    if (qualifications) doctor.qualifications = qualifications;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (teleconsultationEnabled !== undefined) doctor.teleconsultationEnabled = teleconsultationEnabled;
    if (departmentId && ['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user?.role || '')) {
      doctor.department = departmentId;
    }

    await doctor.save();
    return sendSuccess(res, doctor, 'Doctor profile updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update doctor profile', 500);
  }
};

