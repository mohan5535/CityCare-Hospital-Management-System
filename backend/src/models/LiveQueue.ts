import mongoose, { Document, Schema, Types } from 'mongoose';

export type TokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export interface ILiveQueue extends Document {
  doctor: Types.ObjectId;
  date: string; // YYYY-MM-DD
  currentRunningToken: number;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  averageConsultationMinutes: number;
  doctorDelayMinutes: number;
  delayReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQueueEntry extends Document {
  queue: Types.ObjectId;
  tokenNumber: number;
  appointment: Types.ObjectId;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  status: TokenStatus;
  estimatedWaitMinutes: number;
  checkInTime: Date;
  calledAt?: Date;
  consultationStartedAt?: Date;
  consultationEndedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LiveQueueSchema = new Schema<ILiveQueue>(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    currentRunningToken: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['OPEN', 'PAUSED', 'CLOSED'],
      default: 'OPEN',
    },
    averageConsultationMinutes: {
      type: Number,
      default: 15, // fallback estimate
    },
    doctorDelayMinutes: {
      type: Number,
      default: 0,
    },
    delayReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One live queue per doctor per date
LiveQueueSchema.index({ doctor: 1, date: 1 }, { unique: true });

export const LiveQueue = mongoose.model<ILiveQueue>('LiveQueue', LiveQueueSchema);

const QueueEntrySchema = new Schema<IQueueEntry>(
  {
    queue: {
      type: Schema.Types.ObjectId,
      ref: 'LiveQueue',
      required: true,
      index: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
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
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
      default: 'WAITING',
      index: true,
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 0,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    consultationStartedAt: {
      type: Date,
    },
    consultationEndedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

QueueEntrySchema.index({ queue: 1, tokenNumber: 1 }, { unique: true });
QueueEntrySchema.index({ queue: 1, status: 1 });

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', QueueEntrySchema);

