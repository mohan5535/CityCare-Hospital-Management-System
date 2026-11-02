import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Department } from '../src/models/Department';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { QueueEntry } from '../src/models/LiveQueue';

const app = createApp();

describe('Real-Time Queue & Token Management Suite', () => {
  it('should check in patient, assign sequential token, and execute status transitions', async () => {
    // 1. Setup Doctor & Patient
    const dept = await Department.create({
      name: 'Pediatrics',
      slug: 'pediatrics',
      description: 'Child care',
    });

    const docRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dr.pediatest@hms.com',
        password: 'Password123!',
        firstName: 'Dr',
        lastName: 'Pedia',
        role: 'DOCTOR',
        licenseNumber: 'LIC-PED-55',
        departmentId: dept._id.toString(),
        consultationFee: 500,
      });

    const doctorUserId = docRes.body.data.user.id;
    const docToken = docRes.body.data.token;
    await DoctorProfile.findOneAndUpdate(
      { user: doctorUserId },
      { verificationStatus: 'VERIFIED' }
    );

    const pRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient.queue@hms.com',
        password: 'Password123!',
        firstName: 'Sonu',
        lastName: 'Nigam',
        role: 'PATIENT',
      });
    const pToken = pRes.body.data.token;

    // 2. Book appointment
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: '2026-11-05',
        startTime: '09:00',
        endTime: '09:30',
        reasonForVisit: 'Fever and cold',
      });
    expect(bookRes.status).toBe(201);
    const appointmentId = bookRes.body.data._id;

    // 3. Check-in
    const checkinRes = await request(app)
      .post('/api/queue/checkin')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ appointmentId });

    expect(checkinRes.status).toBe(201);
    expect(checkinRes.body.data.tokenNumber).toBe(1);
    expect(checkinRes.body.data.status).toBe('WAITING');
    const entryId = checkinRes.body.data._id;

    // 4. Public Queue Check -> Must NOT leak patient name or illness!
    const publicRes = await request(app).get(`/api/queue/public/${doctorUserId}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.tokens.length).toBe(1);
    expect(publicRes.body.data.tokens[0].tokenNumber).toBe(1);
    expect(publicRes.body.data.tokens[0].patient).toBeUndefined(); // Patient PII NOT exposed!

    // 5. Doctor calls token
    const callRes = await request(app)
      .patch(`/api/queue/${entryId}/status`)
      .set('Authorization', `Bearer ${docToken}`)
      .send({ status: 'CALLED' });

    expect(callRes.status).toBe(200);
    expect(callRes.body.data.status).toBe('CALLED');

    // 6. Doctor starts consultation
    const startRes = await request(app)
      .patch(`/api/queue/${entryId}/status`)
      .set('Authorization', `Bearer ${docToken}`)
      .send({ status: 'IN_CONSULTATION' });

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('IN_CONSULTATION');

    // 7. Doctor completes consultation
    const completeRes = await request(app)
      .patch(`/api/queue/${entryId}/status`)
      .set('Authorization', `Bearer ${docToken}`)
      .send({ status: 'COMPLETED' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
  });
});

