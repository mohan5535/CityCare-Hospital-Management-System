import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Types } from 'mongoose';
import { config } from '../config/env';
import { Payment, IPayment } from '../models/Payment';
import { Appointment } from '../models/Appointment';
import { Notification } from '../models/Notification';
import { logAudit } from '../utils/auditLogger';

let razorpayClient: Razorpay | null = null;
const isPlaceholderKey =
  !config.RAZORPAY_KEY_ID ||
  config.RAZORPAY_KEY_ID === 'rzp_test_placeholder_key' ||
  config.RAZORPAY_KEY_ID.includes('placeholder');

if (!isPlaceholderKey) {
  try {
    razorpayClient = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('[Razorpay] Client initialization warning:', err);
  }
}

export interface CreateOrderParams {
  appointmentId: string;
  patientId: string;
  idempotencyKey?: string;
}

export const createPaymentOrder = async ({
  appointmentId,
  patientId,
  idempotencyKey,
}: CreateOrderParams) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.patient.toString() !== patientId) {
    throw new Error('You can only pay for your own appointment');
  }

  if (appointment.paymentStatus === 'PAID') {
    throw new Error('This appointment has already been paid for');
  }

  // Check existing payment order with idempotency
  if (idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey });
    if (existing) {
      return {
        orderId: existing.razorpayOrderId,
        amount: existing.amount,
        currency: existing.currency,
        keyId: config.RAZORPAY_KEY_ID,
        isSandbox: isPlaceholderKey,
      };
    }
  }

  const amountInPaise = Math.round(appointment.consultationFee * 100);
  let orderId: string;

  if (razorpayClient && !isPlaceholderKey) {
    const order = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${appointment._id.toString().substring(0, 10)}`,
      notes: {
        appointmentId: appointment._id.toString(),
        patientId,
      },
    });
    orderId = order.id;
  } else {
    // Deterministic Mock/Sandbox Order for local testing & CI
    orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const payment = await Payment.create({
    appointment: appointment._id,
    patient: new Types.ObjectId(patientId),
    amount: appointment.consultationFee,
    currency: 'INR',
    razorpayOrderId: orderId,
    status: 'CREATED',
    idempotencyKey,
  });

  return {
    orderId,
    paymentRecordId: payment._id,
    amount: appointment.consultationFee,
    currency: 'INR',
    keyId: config.RAZORPAY_KEY_ID,
    isSandbox: isPlaceholderKey,
  };
};

export interface VerifyPaymentParams {
  appointmentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  patientId: string;
}

export const verifyPaymentSignature = async ({
  appointmentId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  patientId,
}: VerifyPaymentParams) => {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    throw new Error('Payment record not found for this order ID');
  }

  if (payment.status === 'CAPTURED') {
    // Idempotent return
    return payment;
  }

  // In live/real mode: verify signature with HMAC SHA256
  if (!isPlaceholderKey && config.RAZORPAY_KEY_SECRET) {
    if (!razorpaySignature) {
      throw new Error('Missing payment signature');
    }
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      payment.status = 'FAILED';
      payment.failureReason = 'Invalid cryptographic signature';
      await payment.save();
      throw new Error('Invalid payment signature verification failed');
    }
  }

  // Update payment status
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature || 'sandbox_verified';
  payment.status = 'CAPTURED';
  await payment.save();

  // Mark appointment as PAID and CONFIRMED
  const appointment = await Appointment.findById(appointmentId);
  if (appointment) {
    appointment.paymentStatus = 'PAID';
    appointment.status = 'CONFIRMED';
    await appointment.save();
  }

  // Notify patient
  await Notification.create({
    user: patientId,
    title: 'Payment Successful',
    message: `Payment of ₹${payment.amount} was confirmed. Your appointment is guaranteed.`,
    type: 'PAYMENT_SUCCESS',
    actionUrl: `/appointments/${appointmentId}`,
  });

  await logAudit({
    actorId: patientId,
    actorRole: 'PATIENT',
    action: 'PAYMENT_CAPTURED',
    targetResource: 'Payment',
    targetId: payment._id.toString(),
    details: { orderId: razorpayOrderId, paymentId: razorpayPaymentId, amount: payment.amount },
  });

  return payment;
};

// Webhook signature verification and idempotent event dispatch
export const processRazorpayWebhook = async (
  rawBody: string,
  signature: string
): Promise<any> => {
  if (!config.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Webhook secret is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  if (event === 'payment.captured' && paymentEntity) {
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment && payment.status !== 'CAPTURED') {
      payment.status = 'CAPTURED';
      payment.razorpayPaymentId = paymentId;
      payment.rawWebhookPayload = payload;
      await payment.save();

      await Appointment.findByIdAndUpdate(payment.appointment, {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      });
    }
  }

  return { received: true };
};

