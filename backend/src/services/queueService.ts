import { Types } from 'mongoose';
import { LiveQueue, QueueEntry, ILiveQueue, IQueueEntry, TokenStatus } from '../models/LiveQueue';
import { Appointment } from '../models/Appointment';
import { Notification } from '../models/Notification';
import { Server } from 'socket.io';
import { resolveDoctorIdentifier } from '../utils/doctorResolver';

let ioInstance: Server | null = null;

export const setQueueSocketIO = (io: Server) => {
  ioInstance = io;
};

export const getTodayDateString = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const getOrCreateLiveQueue = async (
  doctorId: string,
  dateStr = getTodayDateString()
): Promise<ILiveQueue> => {
  const resolved = await resolveDoctorIdentifier(doctorId);
  const targetId = resolved
    ? resolved.userId
    : Types.ObjectId.isValid(doctorId)
    ? new Types.ObjectId(doctorId)
    : null;

  if (!targetId) {
    throw new Error('Doctor not found');
  }

  let queue = await LiveQueue.findOne({
    doctor: targetId,
    date: dateStr,
  });

  if (!queue) {
    queue = await LiveQueue.create({
      doctor: targetId,
      date: dateStr,
      currentRunningToken: 0,
      status: 'OPEN',
      averageConsultationMinutes: 15,
    });
  }

  return queue;
};

// Check in patient and assign token number
export const checkInAppointment = async (appointmentId: string): Promise<IQueueEntry> => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.status === 'CANCELLED') {
    throw new Error('Cannot check in a cancelled appointment');
  }

  const existingEntry = await QueueEntry.findOne({ appointment: appointment._id });
  if (existingEntry) {
    return existingEntry;
  }

  const today = getTodayDateString();
  const queue = await getOrCreateLiveQueue(appointment.doctor.toString(), today);

  // Calculate next token
  const lastEntry = await QueueEntry.findOne({ queue: queue._id }).sort({ tokenNumber: -1 });
  const nextTokenNumber = (lastEntry ? lastEntry.tokenNumber : 0) + 1;

  // Calculate estimated wait time based on tokens ahead
  const waitingAheadCount = await QueueEntry.countDocuments({
    queue: queue._id,
    status: { $in: ['WAITING', 'CALLED'] },
  });

  const estimatedWait =
    waitingAheadCount * (queue.averageConsultationMinutes || 15) +
    (queue.doctorDelayMinutes || 0);

  const entry = await QueueEntry.create({
    queue: queue._id,
    tokenNumber: nextTokenNumber,
    appointment: appointment._id,
    patient: appointment.patient,
    doctor: appointment.doctor,
    status: 'WAITING',
    estimatedWaitMinutes: estimatedWait,
    checkInTime: new Date(),
  });

  appointment.status = 'IN_QUEUE';
  await appointment.save();

  // Broadcast sanitized update to doctor waiting room
  broadcastQueueUpdate(appointment.doctor.toString(), today);

  // Send private notification to patient
  await Notification.create({
    user: appointment.patient,
    title: `Token #${nextTokenNumber} Assigned`,
    message: `You are checked in! Your token is #${nextTokenNumber}. Approx. wait: ~${estimatedWait} mins.`,
    type: 'QUEUE_UPDATE',
  });

  return entry;
};

// Update token status: CALLED, IN_CONSULTATION, COMPLETED, SKIPPED, CANCELLED
export const updateTokenStatus = async (
  entryId: string,
  newStatus: TokenStatus,
  actorUserId: string
): Promise<IQueueEntry> => {
  const entry = await QueueEntry.findById(entryId).populate('appointment');
  if (!entry) {
    throw new Error('Queue entry not found');
  }

  const queue = await LiveQueue.findById(entry.queue);
  if (!queue) {
    throw new Error('Live queue not found');
  }

  const now = new Date();
  entry.status = newStatus;

  if (newStatus === 'CALLED') {
    entry.calledAt = now;
    queue.currentRunningToken = entry.tokenNumber;
    await queue.save();

    // Notify patient directly
    if (ioInstance) {
      ioInstance.to(`user:${entry.patient.toString()}`).emit('token.called', {
        tokenNumber: entry.tokenNumber,
        message: `Token #${entry.tokenNumber}: Please proceed to the doctor consultation room!`,
      });
    }

    await Notification.create({
      user: entry.patient,
      title: 'Your Token is Called!',
      message: `Token #${entry.tokenNumber}: Please proceed to the doctor consultation room.`,
      type: 'QUEUE_UPDATE',
    });
  } else if (newStatus === 'IN_CONSULTATION') {
    entry.consultationStartedAt = now;
    if (entry.appointment) {
      await Appointment.findByIdAndUpdate(entry.appointment, { status: 'IN_CONSULTATION' });
    }
  } else if (newStatus === 'COMPLETED') {
    entry.consultationEndedAt = now;
    if (entry.consultationStartedAt) {
      const durationMin = Math.max(
        5,
        Math.round((now.getTime() - entry.consultationStartedAt.getTime()) / (1000 * 60))
      );
      // Rolling average update
      queue.averageConsultationMinutes = Math.round(
        (queue.averageConsultationMinutes * 0.7) + (durationMin * 0.3)
      );
      await queue.save();
    }
    if (entry.appointment) {
      await Appointment.findByIdAndUpdate(entry.appointment, { status: 'COMPLETED' });
    }
  }

  await entry.save();

  // Recalculate remaining waiting entries estimated wait times
  const waitingEntries = await QueueEntry.find({
    queue: queue._id,
    status: 'WAITING',
  }).sort({ tokenNumber: 1 });

  let pos = 1;
  for (const waitEntry of waitingEntries) {
    waitEntry.estimatedWaitMinutes =
      pos * queue.averageConsultationMinutes + (queue.doctorDelayMinutes || 0);
    await waitEntry.save();
    pos++;
  }

  // Authoritative broadcast
  broadcastQueueUpdate(entry.doctor.toString(), queue.date);

  return entry;
};

// Record Doctor Delay and broadcast updated wait times
export const recordDoctorDelay = async (
  doctorId: string,
  delayMinutes: number,
  reason = '',
  dateStr = getTodayDateString()
): Promise<ILiveQueue> => {
  const queue = await getOrCreateLiveQueue(doctorId, dateStr);
  queue.doctorDelayMinutes = delayMinutes;
  queue.delayReason = reason;
  await queue.save();

  // Recalculate remaining waiting entries
  const waitingEntries = await QueueEntry.find({
    queue: queue._id,
    status: 'WAITING',
  }).sort({ tokenNumber: 1 });

  let pos = 1;
  for (const waitEntry of waitingEntries) {
    waitEntry.estimatedWaitMinutes =
      pos * queue.averageConsultationMinutes + (queue.doctorDelayMinutes || 0);
    await waitEntry.save();
    pos++;
  }

  broadcastQueueUpdate(queue.doctor.toString(), dateStr);
  return queue;
};

// Safe public queue view (does NOT leak patient identities)
export const getDoctorPublicQueue = async (
  doctorId: string,
  dateStr = getTodayDateString()
) => {
  const resolved = await resolveDoctorIdentifier(doctorId);
  const targetId = resolved
    ? resolved.userId
    : Types.ObjectId.isValid(doctorId)
    ? new Types.ObjectId(doctorId)
    : null;

  if (!targetId) {
    return {
      date: dateStr,
      currentRunningToken: 0,
      status: 'CLOSED',
      averageConsultationMinutes: 15,
      doctorDelayMinutes: 0,
      delayReason: '',
      tokens: [],
      doctor: null,
    };
  }

  const queue = await LiveQueue.findOne({
    doctor: targetId,
    date: dateStr,
  });

  if (!queue) {
    return {
      date: dateStr,
      currentRunningToken: 0,
      status: 'CLOSED',
      averageConsultationMinutes: 15,
      doctorDelayMinutes: 0,
      delayReason: '',
      tokens: [],
      doctor: resolved
        ? { id: resolved.userId.toString(), name: resolved.name, email: resolved.email }
        : null,
    };
  }

  const entries = await QueueEntry.find({ queue: queue._id })
    .select('tokenNumber status estimatedWaitMinutes checkInTime calledAt')
    .sort({ tokenNumber: 1 });

  return {
    queueId: queue._id,
    date: queue.date,
    currentRunningToken: queue.currentRunningToken,
    status: queue.status,
    averageConsultationMinutes: queue.averageConsultationMinutes,
    doctorDelayMinutes: queue.doctorDelayMinutes || 0,
    delayReason: queue.delayReason || '',
    tokens: entries,
    doctor: resolved
      ? { id: resolved.userId.toString(), name: resolved.name, email: resolved.email }
      : null,
  };
};

// Clinical detailed queue view (for Doctor & Receptionist)
export const getDoctorClinicalQueue = async (
  doctorId: string,
  dateStr = getTodayDateString()
) => {
  const queue = await getOrCreateLiveQueue(doctorId, dateStr);
  const entries = await QueueEntry.find({ queue: queue._id })
    .populate('patient', 'firstName lastName phone')
    .populate('appointment', 'reasonForVisit type paymentStatus')
    .sort({ tokenNumber: 1 });

  return {
    queue,
    entries,
  };
};

export const broadcastQueueUpdate = async (doctorId: string, dateStr: string) => {
  if (!ioInstance) return;
  try {
    const publicData = await getDoctorPublicQueue(doctorId, dateStr);
    // Broadcast to room
    ioInstance.to(`doctor_queue:${doctorId}`).emit('queue.updated', publicData);
    if (publicData.doctor?.id && publicData.doctor.id !== doctorId) {
      ioInstance.to(`doctor_queue:${publicData.doctor.id}`).emit('queue.updated', publicData);
    }
  } catch (err) {
    console.error('[Socket Broadcast Error]', err);
  }
};

