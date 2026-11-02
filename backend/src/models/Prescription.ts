import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMedication {
  name: string;
  dosage: string; // e.g. "500 mg"
  route?: string; // e.g. "Oral", "Topical", "IV"
  frequency: string; // e.g. "1-0-1" or "Twice daily"
  duration: string; // e.g. "5 days"
  timing: string; // e.g. "After food"
  quantity?: string; // e.g. "10 Tablets"
  instructions?: string;
}

export interface IVitals {
  bloodPressure?: string; // e.g. "120/80"
  pulseRate?: string; // e.g. "72 bpm"
  temperature?: string; // e.g. "98.6 F"
  respiratoryRate?: string;
  weight?: string; // e.g. "70 kg"
  spO2?: string; // e.g. "98%"
}

export interface IAmendment {
  amendedAt: Date;
  amendedBy: Types.ObjectId;
  previousDiagnosis: string;
  previousMedications: IMedication[];
  reason: string;
}

export interface IPrescription extends Document {
  appointment: Types.ObjectId;
  appointmentReference?: string;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  status: 'DRAFT' | 'FINALIZED';
  version: number;
  symptomsAndFindings?: string;
  diagnosis: string;
  vitals?: IVitals;
  medications: IMedication[];
  labTestsRecommended: string[];
  clinicalNotes?: string;
  additionalAdvice?: string;
  followUpDate?: string;
  amendmentHistory: IAmendment[];
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
    appointmentReference: {
      type: String,
      default: '',
      index: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED'],
      default: 'DRAFT',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    symptomsAndFindings: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    vitals: {
      bloodPressure: { type: String, default: '' },
      pulseRate: { type: String, default: '' },
      temperature: { type: String, default: '' },
      respiratoryRate: { type: String, default: '' },
      weight: { type: String, default: '' },
      spO2: { type: String, default: '' },
    },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        route: { type: String, default: 'Oral' },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        timing: { type: String, default: 'After food' },
        quantity: { type: String, default: '' },
        instructions: { type: String, default: '' },
      },
    ],
    labTestsRecommended: {
      type: [String],
      default: [],
    },
    clinicalNotes: {
      type: String,
      default: '',
    },
    additionalAdvice: {
      type: String,
      default: '',
    },
    followUpDate: {
      type: String,
    },
    amendmentHistory: [
      {
        amendedAt: { type: Date, default: Date.now },
        amendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        previousDiagnosis: { type: String },
        previousMedications: { type: Array, default: [] },
        reason: { type: String, default: 'Clinical adjustment' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

