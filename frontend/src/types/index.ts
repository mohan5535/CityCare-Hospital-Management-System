export type UserRole =
  | 'SUPER_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'PATIENT';

export interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: string;
}

export interface Department {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export interface DoctorProfile {
  _id: string;
  user: User;
  department: Department;
  licenseNumber: string;
  specialization: string[];
  qualifications: string[];
  experienceYears: number;
  consultationFee: number;
  bio: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  teleconsultationEnabled: boolean;
  averageRating: number;
  totalReviews: number;
}

export interface GeneratedSlot {
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'LOCKED_PENDING_PAYMENT' | 'BOOKED' | 'BLOCKED';
  slotId?: string;
}

export interface Appointment {
  _id: string;
  appointmentReference?: string;
  patient: User;
  doctor: User;
  department: Department;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: 'IN_PERSON' | 'TELECONSULTATION';
  status:
    | 'PENDING_PAYMENT'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'IN_QUEUE'
    | 'IN_CONSULTATION'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'RESCHEDULED'
    | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'WAIVED';
  consultationFee: number;
  doctorDelayMinutes?: number;
  reasonForVisit: string;
  symptomsSummary?: string;
  consultationStartedAt?: string;
  consultationEndedAt?: string;
  consultationNotes?: string;
  prescription?: {
    _id: string;
    status: 'DRAFT' | 'FINALIZED';
    version: number;
    diagnosis: string;
    followUpDate?: string;
    createdAt: string;
  } | null;
  teleconsultationRoomId?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface QueueToken {
  tokenNumber: number;
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  estimatedWaitMinutes: number;
  checkInTime?: string;
  calledAt?: string;
}

export interface PublicQueueData {
  queueId: string;
  date: string;
  currentRunningToken: number;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  averageConsultationMinutes: number;
  doctorDelayMinutes?: number;
  delayReason?: string;
  tokens: QueueToken[];
  doctor?: { id: string; name: string; email: string } | null;
}

export interface ClinicalQueueEntry {
  _id: string;
  tokenNumber: number;
  patient: User;
  appointment: {
    _id: string;
    appointmentReference?: string;
    reasonForVisit: string;
    type: string;
    paymentStatus: string;
  };
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  estimatedWaitMinutes: number;
  checkInTime: string;
}

export interface Prescription {
  _id: string;
  appointment: any;
  appointmentReference?: string;
  doctor: User;
  patient: User;
  status?: 'DRAFT' | 'FINALIZED';
  version?: number;
  symptomsAndFindings?: string;
  diagnosis: string;
  vitals?: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    weight?: string;
    spO2?: string;
  };
  medications: Array<{
    name: string;
    dosage: string;
    route?: string;
    frequency: string;
    duration: string;
    timing: string;
    quantity?: string;
    instructions?: string;
  }>;
  labTestsRecommended?: string[];
  clinicalNotes?: string;
  additionalAdvice?: string;
  followUpDate?: string;
  amendmentHistory?: Array<{
    amendedAt: string;
    reason: string;
    previousDiagnosis?: string;
  }>;
  createdAt: string;
}

