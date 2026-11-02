import { Request, Response } from 'express';
import { registerUser, loginUser, getUserProfile } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { User } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorProfile } from '../models/DoctorProfile';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, result, 'Registration successful', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Registration failed', 400);
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Login failed', 401);
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    const result = await getUserProfile(req.user._id.toString(), req.user.role);
    return sendSuccess(res, result, 'Profile retrieved successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to retrieve profile', 500);
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { firstName, lastName, phone, dateOfBirth, gender, bloodGroup, address, allergies, chronicConditions, emergencyContact } = req.body;

    if (firstName || lastName || phone) {
      if (firstName) req.user.firstName = firstName;
      if (lastName) req.user.lastName = lastName;
      if (phone !== undefined) req.user.phone = phone;
      await req.user.save();
    }

    let profile: any = null;
    if (req.user.role === 'PATIENT') {
      profile = await PatientProfile.findOne({ user: req.user._id });
      if (!profile) {
        profile = new PatientProfile({ user: req.user._id });
      }
      if (dateOfBirth) profile.dateOfBirth = new Date(dateOfBirth);
      if (gender) profile.gender = gender;
      if (bloodGroup) profile.bloodGroup = bloodGroup;
      if (address !== undefined) profile.address = address;
      if (allergies) profile.allergies = allergies;
      if (chronicConditions) profile.chronicConditions = chronicConditions;
      if (emergencyContact) profile.emergencyContact = emergencyContact;
      await profile.save();
    } else if (req.user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ user: req.user._id }).populate('department');
    }

    return sendSuccess(res, { user: req.user, profile }, 'Profile updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update profile', 400);
  }
};

