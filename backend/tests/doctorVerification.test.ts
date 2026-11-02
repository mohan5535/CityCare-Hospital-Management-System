import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Department } from '../src/models/Department';
import { DoctorProfile } from '../src/models/DoctorProfile';

const app = createApp();

describe('Doctor Verification & Access Control Suite', () => {
  it('should register a doctor with PENDING verification status and prevent booking until verified', async () => {
    // 1. Create Department
    const dept = await Department.create({
      name: 'Cardiology Test',
      slug: 'cardiology-test',
      description: 'Cardiac care',
    });

    // 2. Register Doctor
    const docRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'doc.test@hms.com',
        password: 'Password123!',
        firstName: 'Vikram',
        lastName: 'Bose',
        role: 'DOCTOR',
        licenseNumber: 'LIC-TEST-001',
        departmentId: dept._id.toString(),
        consultationFee: 500,
      });

    expect(docRes.status).toBe(201);
    const doctorUserId = docRes.body.data.user.id;
    const docProfile = await DoctorProfile.findOne({ user: doctorUserId });
    expect(docProfile?.verificationStatus).toBe('PENDING');

    // 3. Register Patient
    const patientRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient.book@hms.com',
        password: 'Password123!',
        firstName: 'Pooja',
        lastName: 'Nair',
        role: 'PATIENT',
      });
    const patientToken = patientRes.body.data.token;

    // 4. Attempt booking with UNVERIFIED doctor -> Must fail!
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: '2026-11-10',
        startTime: '10:00',
        endTime: '10:30',
        reasonForVisit: 'Heart checkup',
      });

    expect(bookRes.status).toBe(400);
    expect(bookRes.body.message).toContain('not currently verified');

    // 5. Register Admin and verify the doctor
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin.verify@hms.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'Chief',
        role: 'HOSPITAL_ADMIN',
      });
    const adminToken = adminRes.body.data.token;

    const verifyRes = await request(app)
      .patch(`/api/doctors/admin/verify/${docProfile?._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'VERIFIED',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');

    // 6. Now booking should succeed!
    const successBookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: '2026-11-10',
        startTime: '10:00',
        endTime: '10:30',
        reasonForVisit: 'Heart checkup',
      });

    expect(successBookRes.status).toBe(201);
    expect(successBookRes.body.data.status).toBe('CONFIRMED');
  });
});

