import { DoctorAvailability } from '../models/DoctorAvailability';
import { AppointmentSlot, SlotStatus } from '../models/AppointmentSlot';
import { Types } from 'mongoose';

export interface GeneratedSlot {
  startTime: string;
  endTime: string;
  status: SlotStatus;
  slotId?: string;
}

// Convert "HH:mm" to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert minutes from midnight to "HH:mm"
export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getOrGenerateSlotsForDate = async (
  doctorId: string,
  dateStr: string // YYYY-MM-DD
): Promise<GeneratedSlot[]> => {
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon ...

  // Find doctor's availability for that day of week
  const schedule = await DoctorAvailability.findOne({
    doctor: doctorId,
    dayOfWeek,
  });

  if (!schedule || schedule.isDayOff) {
    return [];
  }

  const startMin = timeToMinutes(schedule.startTime);
  const endMin = timeToMinutes(schedule.endTime);
  const duration = schedule.slotDurationMinutes || 30;

  // Find all existing slots in database for this doctor & date
  const existingSlots = await AppointmentSlot.find({
    doctor: doctorId,
    date: dateStr,
  });

  const slotMap = new Map<string, any>();
  const now = new Date();

  existingSlots.forEach((slot) => {
    // If lock expired, treat as available
    let currentStatus = slot.status;
    if (
      currentStatus === 'LOCKED_PENDING_PAYMENT' &&
      slot.lockExpiresAt &&
      slot.lockExpiresAt < now
    ) {
      currentStatus = 'AVAILABLE';
    }
    slotMap.set(slot.startTime, {
      id: slot._id.toString(),
      status: currentStatus,
      endTime: slot.endTime,
    });
  });

  const slots: GeneratedSlot[] = [];

  for (let current = startMin; current + duration <= endMin; current += duration) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + duration);

    // Check if slot falls in a break
    const isInBreak = schedule.breakTimes?.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return current < bEnd && current + duration > bStart;
    });

    if (isInBreak) {
      continue;
    }

    const recorded = slotMap.get(slotStart);
    if (recorded) {
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        status: recorded.status,
        slotId: recorded.id,
      });
    } else {
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        status: 'AVAILABLE',
      });
    }
  }

  return slots;
};

// Atomically lock a slot for 10 minutes to prevent race condition double-booking
export const atomicLockSlot = async (
  doctorId: string,
  dateStr: string,
  startTime: string,
  endTime: string,
  patientId: string
): Promise<any> => {
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minute lock

  // Try finding existing slot that is either AVAILABLE or has an EXPIRED lock
  let slot = await AppointmentSlot.findOneAndUpdate(
    {
      doctor: new Types.ObjectId(doctorId),
      date: dateStr,
      startTime: startTime,
      $or: [
        { status: 'AVAILABLE' },
        { status: 'LOCKED_PENDING_PAYMENT', lockExpiresAt: { $lt: now } },
      ],
    },
    {
      $set: {
        endTime: endTime,
        status: 'LOCKED_PENDING_PAYMENT',
        lockedBy: new Types.ObjectId(patientId),
        lockExpiresAt: lockExpiresAt,
      },
    },
    { new: true }
  );

  if (slot) {
    return slot;
  }

  // If slot record does not exist in DB yet, attempt to create and lock it atomically
  try {
    slot = await AppointmentSlot.create({
      doctor: new Types.ObjectId(doctorId),
      date: dateStr,
      startTime,
      endTime,
      status: 'LOCKED_PENDING_PAYMENT',
      lockedBy: new Types.ObjectId(patientId),
      lockExpiresAt,
    });
    return slot;
  } catch (error: any) {
    // If unique key violation (E11000), someone else just locked or booked it concurrently!
    if (error.code === 11000) {
      throw new Error('This appointment slot has already been selected or booked by another patient.');
    }
    throw error;
  }
};

