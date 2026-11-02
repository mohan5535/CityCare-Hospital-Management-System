import mongoose, { Document, Schema, Types } from 'mongoose';

export type SlotStatus = 'AVAILABLE' | 'LOCKED_PENDING_PAYMENT' | 'BOOKED' | 'BLOCKED';

export interface IAppointmentSlot extends Document {
  doctor: Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SlotStatus;
  lockedBy?: Types.ObjectId;
  lockExpiresAt?: Date;
  appointment?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSlotSchema = new Schema<IAppointmentSlot>(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format for fast, unambiguous date queries
      required: true,
      index: true,
    },
    startTime: {
      type: String, // "09:00"
      required: true,
    },
    endTime: {
      type: String, // "09:30"
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'LOCKED_PENDING_PAYMENT', 'BOOKED', 'BLOCKED'],
      default: 'AVAILABLE',
      index: true,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lockExpiresAt: {
      type: Date,
      index: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE CONSTRAINT: Prevents double-booking at the database level!
AppointmentSlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

export const AppointmentSlot = mongoose.model<IAppointmentSlot>(
  'AppointmentSlot',
  AppointmentSlotSchema
);

