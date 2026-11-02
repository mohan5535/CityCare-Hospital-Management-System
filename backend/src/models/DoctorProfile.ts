import mongoose, { Document, Schema, Types } from 'mongoose';

export type DoctorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IDoctorDocument {
  name: string;
  documentType: 'DEGREE' | 'REGISTRATION' | 'ID_PROOF' | 'OTHER';
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Date;
}

export interface IDoctorProfile extends Document {
  user: Types.ObjectId;
  department: Types.ObjectId;
  licenseNumber: string;
  specialization: string[];
  qualifications: string[];
  medicalDegree?: string;
  university?: string;
  graduationYear?: number;
  experienceYears: number;
  consultationFee: number;
  hospitalAddress?: string;
  consultationModes?: ('IN_PERSON' | 'TELECONSULTATION')[];
  bio: string;
  profilePhoto?: string;
  documents?: IDoctorDocument[];
  verificationStatus: DoctorVerificationStatus;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  teleconsultationEnabled: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorDocumentSchema = new Schema<IDoctorDocument>(
  {
    name: { type: String, required: true },
    documentType: {
      type: String,
      enum: ['DEGREE', 'REGISTRATION', 'ID_PROOF', 'OTHER'],
      default: 'OTHER',
    },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    specialization: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: [String],
      default: [],
    },
    medicalDegree: {
      type: String,
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },
    graduationYear: {
      type: Number,
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    hospitalAddress: {
      type: String,
      trim: true,
    },
    consultationModes: {
      type: [String],
      enum: ['IN_PERSON', 'TELECONSULTATION'],
      default: ['IN_PERSON', 'TELECONSULTATION'],
    },
    bio: {
      type: String,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    documents: {
      type: [DoctorDocumentSchema],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    teleconsultationEnabled: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const DoctorProfile = mongoose.model<IDoctorProfile>('DoctorProfile', DoctorProfileSchema);
