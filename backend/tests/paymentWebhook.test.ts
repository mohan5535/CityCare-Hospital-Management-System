import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../src/app';
import { config } from '../src/config/env';
import { Department } from '../src/models/Department';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { Payment } from '../src/models/Payment';

const app = createApp();

describe('Payment & Webhook Integrity Suite', () => {
  it('should create payment order, verify signature, and handle webhooks safely', async () => {
    // 1. Setup doctor and patient
    const dept = await Department.create({
      name: 'Neurology',
      slug: 'neurology',
      description: 'Nerve care',
    });

    const docRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dr.neurotest@hms.com',
        password: 'Password123!',
        firstName: 'Dr',
        lastName: 'Neuro',
        role: 'DOCTOR',
        licenseNumber: 'LIC-NEUR-77',
        departmentId: dept._id.toString(),
        consultationFee: 900,
      });

    const doctorUserId = docRes.body.data.user.id;
    await DoctorProfile.findOneAndUpdate(
      { user: doctorUserId },
      { verificationStatus: 'VERIFIED' }
    );

    const pRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient.pay@hms.com',
        password: 'Password123!',
        firstName: 'Amit',
        lastName: 'Verma',
        role: 'PATIENT',
      });
    const pToken = pRes.body.data.token;

    // 2. Book appointment
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: '2026-11-25',
        startTime: '10:00',
        endTime: '10:30',
        reasonForVisit: 'Severe migraine',
      });
    expect(bookRes.status).toBe(201);
    const appointmentId = bookRes.body.data._id;

    // 3. Create payment order
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ appointmentId });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.orderId).toBeDefined();
    expect(orderRes.body.data.amount).toBe(900);
    const orderId = orderRes.body.data.orderId;

    // 4. Verify payment
    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${pToken}`)
      .send({
        appointmentId,
        razorpayOrderId: orderId,
        razorpayPaymentId: 'pay_test_12345',
        razorpaySignature: 'mock_signature',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('CAPTURED');

    // 5. Webhook HMAC test
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET;
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_999',
            order_id: orderId,
            amount: 90000,
            status: 'captured',
          },
        },
      },
    });

    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const webhookRes = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(webhookPayload);

    expect(webhookRes.status).toBe(200);

    // 6. Test invalid webhook signature -> Must reject 400!
    const badWebhookRes = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'forged_invalid_signature')
      .send(webhookPayload);

    expect(badWebhookRes.status).toBe(400);
  });
});
