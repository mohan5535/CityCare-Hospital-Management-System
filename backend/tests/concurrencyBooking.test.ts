import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Department } from '../src/models/Department';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { Appointment } from '../src/models/Appointment';

const app = createApp();

describe('Concurrency & Reliable Booking Suite', () => {
  it('should prevent double-booking when two patients attempt to book the exact same slot concurrently', async () => {
    // 1. Setup Department & Verified Doctor
    const dept = await Department.create({
      name: 'Orthopedics',
      slug: 'orthopedics',
      description: 'Bone & joints',
    });

    const docRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dr.ortho@hms.com',
        password: 'Password123!',
        firstName: 'Sunil',
        lastName: 'Gavaskar',
        role: 'DOCTOR',
        licenseNumber: 'LIC-ORTHO-11',
        departmentId: dept._id.toString(),
        consultationFee: 700,
      });

    const doctorUserId = docRes.body.data.user.id;
    await DoctorProfile.findOneAndUpdate(
      { user: doctorUserId },
      { verificationStatus: 'VERIFIED' }
    );

    // 2. Setup Patient 1 and Patient 2
    const p1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient1@hms.com',
        password: 'Password123!',
        firstName: 'Patient',
        lastName: 'One',
        role: 'PATIENT',
      });

    const p2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient2@hms.com',
        password: 'Password123!',
        firstName: 'Patient',
        lastName: 'Two',
        role: 'PATIENT',
      });

    const token1 = p1.body.data.token;
    const token2 = p2.body.data.token;

    const targetDate = '2026-11-15';
    const startTime = '11:00';
    const endTime = '11:30';

    // 3. Fire BOTH booking requests SIMULTANEOUSLY with Promise.all
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          doctorId: doctorUserId,
          appointmentDate: targetDate,
          startTime,
          endTime,
          reasonForVisit: 'Joint pain P1',
        }),
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          doctorId: doctorUserId,
          appointmentDate: targetDate,
          startTime,
          endTime,
          reasonForVisit: 'Joint pain P2',
        }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // One MUST succeed (201) and one MUST fail with conflict (400)
    expect(statuses).toEqual([201, 400]);

    const failedRes = res1.status === 400 ? res1 : res2;
    expect(failedRes.body.message).toContain('already been selected or booked');

    // Verify only ONE appointment was written to MongoDB
    const count = await Appointment.countDocuments({
      doctor: doctorUserId,
      appointmentDate: targetDate,
      startTime,
    });
    expect(count).toBe(1);
  });

  it('should support idempotency keys and return existing appointment on retry', async () => {
    const dept = await Department.create({
      name: 'General',
      slug: 'general',
      description: 'General care',
    });

    const docRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dr.gen@hms.com',
        password: 'Password123!',
        firstName: 'Dr',
        lastName: 'General',
        role: 'DOCTOR',
        licenseNumber: 'LIC-GEN-88',
        departmentId: dept._id.toString(),
        consultationFee: 400,
      });

    const doctorUserId = docRes.body.data.user.id;
    await DoctorProfile.findOneAndUpdate(
      { user: doctorUserId },
      { verificationStatus: 'VERIFIED' }
    );

    const patientRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient.idem@hms.com',
        password: 'Password123!',
        firstName: 'Idem',
        lastName: 'Patient',
        role: 'PATIENT',
      });

    const token = patientRes.body.data.token;
    const idempotencyKey = 'unique-key-abc-123';

    // First request
    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: '2026-11-20',
        startTime: '14:00',
        endTime: '14:30',
        reasonForVisit: 'Checkup',
        idempotencyKey,
      });

    expect(res1.status).toBe(201);
    const appointmentId1 = res1.body.data._id;

    // Retry with SAME idempotency key
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: '2026-11-20',
        startTime: '14:00',
        endTime: '14:30',
        reasonForVisit: 'Checkup',
        idempotencyKey,
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data._id).toBe(appointmentId1);

    // Ensure only 1 record created in DB
    const totalAppointments = await Appointment.countDocuments({ idempotencyKey });
    expect(totalAppointments).toBe(1);
  });
});

