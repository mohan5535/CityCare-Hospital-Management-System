import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorProfile } from '../models/DoctorProfile';
import { Department } from '../models/Department';
import { config } from '../config/env';
import { logAudit } from '../utils/auditLogger';

export interface RegisterInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  licenseNumber?: string;
  consultationFee?: number;
  specialization?: string[];
  experienceYears?: number;
  bio?: string;
}

export interface AuthTokens {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: string;
  };
  profile?: any;
}

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as any }
  );
};

export const registerUser = async (input: RegisterInput): Promise<AuthTokens> => {
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new Error('A user with this email address already exists.');
  }

  // Doctor role validation
  if (input.role === 'DOCTOR') {
    if (!input.licenseNumber) {
      throw new Error('License number is required for doctor registration.');
    }
    const existingDoctor = await DoctorProfile.findOne({ licenseNumber: input.licenseNumber });
    if (existingDoctor) {
      throw new Error('A doctor with this license number is already registered.');
    }
  }

  // Create User
  const user = await User.create({
    email: input.email.toLowerCase(),
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    role: input.role,
    status: input.role === 'DOCTOR' ? 'PENDING_VERIFICATION' : 'ACTIVE',
  });

  let profile: any = null;

  // Create associated profile
  if (input.role === 'PATIENT') {
    profile = await PatientProfile.create({
      user: user._id,
    });
  } else if (input.role === 'DOCTOR') {
    let departmentId = input.departmentId;
    if (!departmentId) {
      // Find or assign default General Medicine department
      const generalDept = await Department.findOne({ slug: 'general-medicine' });
      if (generalDept) {
        departmentId = generalDept._id.toString();
      }
    }

    profile = await DoctorProfile.create({
      user: user._id,
      department: departmentId,
      licenseNumber: input.licenseNumber || `LIC-${Date.now()}`,
      specialization: input.specialization || ['General Practice'],
      experienceYears: input.experienceYears || 0,
      consultationFee: input.consultationFee || 500,
      bio: input.bio || '',
      verificationStatus: 'PENDING',
    });
  }

  await logAudit({
    actorId: user._id.toString(),
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_REGISTERED',
    targetResource: 'User',
    targetId: user._id.toString(),
    details: { role: user.role },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    },
    profile,
  };
};

export const loginUser = async (email: string, password: string): Promise<AuthTokens> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  if (user.status === 'SUSPENDED') {
    throw new Error('This account has been suspended. Please contact administrator.');
  }

  user.lastLogin = new Date();
  await user.save();

  let profile: any = null;
  if (user.role === 'PATIENT') {
    profile = await PatientProfile.findOne({ user: user._id });
  } else if (user.role === 'DOCTOR') {
    profile = await DoctorProfile.findOne({ user: user._id }).populate('department');
  }

  await logAudit({
    actorId: user._id.toString(),
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_LOGIN',
    targetResource: 'User',
    targetId: user._id.toString(),
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    },
    profile,
  };
};

export const getUserProfile = async (userId: string, role: UserRole) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  let profile: any = null;
  if (role === 'PATIENT') {
    profile = await PatientProfile.findOne({ user: user._id });
  } else if (role === 'DOCTOR') {
    profile = await DoctorProfile.findOne({ user: user._id }).populate('department');
  }

  return { user, profile };
};

