import { Types } from 'mongoose';
import { User } from '../models/User';
import { DoctorProfile, IDoctorProfile } from '../models/DoctorProfile';

export interface ResolvedDoctor {
  userId: Types.ObjectId;
  doctorProfile?: IDoctorProfile | null;
  email: string;
  name: string;
}

/**
 * Universally resolves any doctor identifier:
 * - A User ObjectId string (24-hex)
 * - A DoctorProfile ObjectId string (24-hex)
 * - A Doctor email address (e.g. dr.priya@hms.com)
 *
 * Never throws BSON/ObjectId CastErrors.
 */
export const resolveDoctorIdentifier = async (
  identifier: string
): Promise<ResolvedDoctor | null> => {
  if (!identifier || typeof identifier !== 'string') return null;

  const trimmed = decodeURIComponent(identifier).trim();

  // 1. Email Lookup (e.g. dr.priya@hms.com)
  if (trimmed.includes('@')) {
    const user = await User.findOne({ email: trimmed.toLowerCase() });
    if (!user) return null;

    const profile = await DoctorProfile.findOne({ user: user._id });
    return {
      userId: user._id as Types.ObjectId,
      doctorProfile: profile,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
  }

  // 2. ObjectId Lookup
  if (Types.ObjectId.isValid(trimmed)) {
    const objId = new Types.ObjectId(trimmed);

    // Check if it matches a User document with DOCTOR role
    const user = await User.findById(objId);
    if (user && user.role === 'DOCTOR') {
      const profile = await DoctorProfile.findOne({ user: user._id });
      return {
        userId: user._id as Types.ObjectId,
        doctorProfile: profile,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
      };
    }

    // Check if it matches a DoctorProfile document
    const profile = await DoctorProfile.findById(objId).populate('user');
    if (profile && profile.user) {
      const u = profile.user as any;
      return {
        userId: u._id as Types.ObjectId,
        doctorProfile: profile,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`.trim(),
      };
    }
  }

  return null;
};

