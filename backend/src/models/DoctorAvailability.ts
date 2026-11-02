import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBreakTime {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  title?: string;
}

export interface IDoctorAvailability extends Document {
  doctor: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number; // default: 30
  breakTimes: IBreakTime[];
  isDayOff: boolean;
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorAvailabilitySchema = new Schema<IDoctorAvailability>(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    breakTimes: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        title: { type: String, default: 'Break' },
      },
    ],
    isDayOff: {
      type: Boolean,
      default: false,
    },
    effectiveStartDate: {
      type: Date,
    },
    effectiveEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee one schedule per day per doctor
DoctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });

export const DoctorAvailability = mongoose.model<IDoctorAvailability>(
  'DoctorAvailability',
  DoctorAvailabilitySchema
);

