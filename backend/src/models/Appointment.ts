import mongoose, { Document, Schema, Types } from 'mongoose';

export type AppointmentType = 'IN_PERSON' | 'TELECONSULTATION';
export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_QUEUE'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'WAIVED';

export interface IAppointment extends Document {
  appointmentReference: string;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  department: Types.ObjectId;
  slot?: Types.ObjectId;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: AppointmentType;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  consultationFee: number;
  doctorDelayMinutes: number;
  reasonForVisit: string;
  symptomsSummary?: string;
  consultationStartedAt?: Date;
  consultationEndedAt?: Date;
  consultationNotes?: string;
  completedByDoctor?: Types.ObjectId;
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  rescheduledFrom?: Types.ObjectId;
  idempotencyKey?: string;
  teleconsultationRoomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentReference: {
      type: String,
      unique: true,
      sparse: true,
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
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'AppointmentSlot',
      index: true,
    },
    appointmentDate: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['IN_PERSON', 'TELECONSULTATION'],
      default: 'IN_PERSON',
    },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_QUEUE',
        'IN_CONSULTATION',
        'COMPLETED',
        'CANCELLED',
        'RESCHEDULED',
        'NO_SHOW',
      ],
      default: 'CONFIRMED',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED', 'WAIVED'],
      default: 'PENDING',
      index: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    doctorDelayMinutes: {
      type: Number,
      default: 0,
    },
    reasonForVisit: {
      type: String,
      required: true,
      trim: true,
    },
    symptomsSummary: {
      type: String,
      default: '',
    },
    consultationStartedAt: {
      type: Date,
    },
    consultationEndedAt: {
      type: Date,
    },
    consultationNotes: {
      type: String,
      default: '',
    },
    completedByDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    teleconsultationRoomId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate clean human-readable reference if absent
AppointmentSchema.pre('save', function (next) {
  if (!this.appointmentReference) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.appointmentReference = `APT-${year}-${randomSuffix}`;
  }
  next();
});

// Helpful query indexes
AppointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
AppointmentSchema.index({ patient: 1, appointmentDate: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);

