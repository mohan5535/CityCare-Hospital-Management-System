import mongoose, { Document, Schema, Types } from 'mongoose';

export type WaitlistStatus = 'ACTIVE' | 'OFFERED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

export interface IWaitlistEntry extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  desiredDate: string; // YYYY-MM-DD
  preferredTimeRange?: {
    start: string;
    end: string;
  };
  priority: number;
  status: WaitlistStatus;
  offeredSlot?: Types.ObjectId;
  offerExpiresAt?: Date;
  notificationSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistEntrySchema = new Schema<IWaitlistEntry>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    desiredDate: {
      type: String,
      required: true,
      index: true,
    },
    preferredTimeRange: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    priority: {
      type: Number,
      default: 1, // higher number = higher priority
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'OFFERED', 'CLAIMED', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    offeredSlot: {
      type: Schema.Types.ObjectId,
      ref: 'AppointmentSlot',
    },
    offerExpiresAt: {
      type: Date,
      index: true,
    },
    notificationSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

WaitlistEntrySchema.index({ doctor: 1, desiredDate: 1, status: 1, priority: -1, createdAt: 1 });

export const WaitlistEntry = mongoose.model<IWaitlistEntry>('WaitlistEntry', WaitlistEntrySchema);

