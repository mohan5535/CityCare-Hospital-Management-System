import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { Department } from '../src/models/Department';
import { Appointment } from '../src/models/Appointment';
import { LiveQueue } from '../src/models/LiveQueue';

const app = createApp();

describe('Comprehensive End-to-End Hospital Workflow Suite', () => {
  it('executes complete 16-step clinical workflow seamlessly', async () => {
    // 1. Setup Department & Doctor
    const dept = await Department.create({
      name: 'Cardiology Clinic',
      slug: 'cardiology-clinic',
      description: 'Comprehensive cardiovascular care',
      consultationFee: 750,
      icon: 'Heart',
    });

    const docUser = await User.create({
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'dr.rajesh.sharma@hms.com',
      password: 'SecurePassword123!',
      role: 'DOCTOR',
      phone: '+919876543210',
    });

    await DoctorProfile.create({
      user: docUser._id,
      department: dept._id,
      licenseNumber: 'MCI-CARD-9921',
      specialization: ['Interventional Cardiology', 'Heart Failure'],
      qualifications: ['MBBS', 'MD (Cardiology)'],
      experienceYears: 14,
      consultationFee: 750,
      verificationStatus: 'VERIFIED',
      bio: 'Senior Consultant Interventional Cardiologist',
      averageConsultationTimeMinutes: 15,
    });

    // Login Doctor
    const docLoginRes = await request(app).post('/api/auth/login').send({
      email: 'dr.rajesh.sharma@hms.com',
      password: 'SecurePassword123!',
    });
    expect(docLoginRes.status).toBe(200);
    const doctorToken = docLoginRes.body.data.token;
    const doctorUserId = docUser._id.toString();

    // 2. Step 1: Patient Registration
    const regRes = await request(app).post('/api/auth/register').send({
      firstName: 'Aarav',
      lastName: 'Verma',
      email: 'aarav.verma@example.com',
      password: 'StrongPatientPass123!',
      role: 'PATIENT',
      phone: '+919123456789',
    });
    expect(regRes.status).toBe(201);
    const patientToken = regRes.body.data.token;

    // 3. Step 2: Patient discovers verified doctors
    const docRes = await request(app).get('/api/doctors');
    expect(docRes.status).toBe(200);
    const foundDoc = docRes.body.data.find(
      (d: any) => d.email === 'dr.rajesh.sharma@hms.com' || d.user?._id === doctorUserId
    );
    expect(foundDoc).toBeDefined();

    // 4. Step 3: Patient books appointment
    const today = new Date().toISOString().split('T')[0];
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUserId,
        appointmentDate: today,
        startTime: '10:00',
        endTime: '10:15',
        type: 'IN_PERSON',
        reasonForVisit: 'Chest discomfort and routine cardiac checkup',
        symptomsSummary: 'Mild palpitations after physical exertion',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.appointmentReference).toMatch(/^APT-\d{4}-\d{6}$/);
    const bookedAppointmentId = bookRes.body.data._id;
    const bookedReference = bookRes.body.data.appointmentReference;

    // 5. Step 4: Verify Database persistence
    const dbAppt = await Appointment.findById(bookedAppointmentId);
    expect(dbAppt).not.toBeNull();
    expect(dbAppt?.status).toBe('CONFIRMED');
    expect(dbAppt?.appointmentReference).toBe(bookedReference);

    // 6. Step 5: Doctor views appointment on Doctor Dashboard
    const docApptsRes = await request(app)
      .get('/api/appointments/my?scope=today')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docApptsRes.status).toBe(200);
    const docListing = docApptsRes.body.data.find((a: any) => a._id === bookedAppointmentId);
    expect(docListing).toBeDefined();

    // 7. Step 6: Patient views appointment in Patient Portal
    const patientApptsRes = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patientApptsRes.status).toBe(200);
    const patientListing = patientApptsRes.body.data.find((a: any) => a._id === bookedAppointmentId);
    expect(patientListing).toBeDefined();
    expect(patientListing.appointmentReference).toBe(bookedReference);

    // 8. Step 7: Patient Checks In and receives sequential Token #1
    const checkInRes = await request(app)
      .post('/api/queue/checkin')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ appointmentId: bookedAppointmentId });
    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.data.tokenNumber).toBe(1);
    expect(checkInRes.body.data.status).toBe('WAITING');
    const queueEntryId = checkInRes.body.data._id;

    // 9. Step 8: Public Queue tracker displays token without exposing patient PII
    const publicRes = await request(app).get(`/api/queue/public/${doctorUserId}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.tokens.length).toBe(1);
    expect(publicRes.body.data.tokens[0].tokenNumber).toBe(1);
    expect(publicRes.body.data.tokens[0].patient).toBeUndefined();

    // 10. Step 9: Doctor records a 15-minute emergency consultation delay
    const delayRes = await request(app)
      .post('/api/queue/delay')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        delayMinutes: 15,
        reason: 'Emergency ICU Cardiac Catheterization',
      });
    expect(delayRes.status).toBe(200);
    expect(delayRes.body.data.doctorDelayMinutes).toBe(15);
    expect(delayRes.body.data.delayReason).toBe('Emergency ICU Cardiac Catheterization');

    // 11. Step 10: Doctor calls Token #1 to examination room
    const callRes = await request(app)
      .patch(`/api/queue/${queueEntryId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'CALLED' });
    expect(callRes.status).toBe(200);
    expect(callRes.body.data.status).toBe('CALLED');

    const liveQueueDoc = await LiveQueue.findOne({ doctor: doctorUserId });
    expect(liveQueueDoc?.currentRunningToken).toBe(1);

    // 12. Step 11: Doctor starts consultation -> IN_CONSULTATION state
    const consultRes = await request(app)
      .patch(`/api/queue/${queueEntryId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'IN_CONSULTATION' });
    expect(consultRes.status).toBe(200);
    expect(consultRes.body.data.status).toBe('IN_CONSULTATION');

    const inConsultAppt = await Appointment.findById(bookedAppointmentId);
    expect(inConsultAppt?.status).toBe('IN_CONSULTATION');

    // 13. Step 12: Doctor saves draft clinical prescription
    const draftRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: bookedAppointmentId,
        diagnosis: 'Mild Sinus Tachycardia, Borderline Hypertension',
        symptomsAndFindings: 'S1/S2 heard clearly, no murmurs. Mild resting tachycardia.',
        vitals: {
          bloodPressure: '135/88 mmHg',
          pulseRate: '88 bpm',
          temperature: '98.4 F',
          spO2: '99%',
          weight: '72 kg',
        },
        medications: [
          {
            name: 'Metoprolol Tartrate',
            dosage: '25 mg',
            frequency: '1-0-0 (Morning)',
            duration: '14 days',
            timing: 'After breakfast',
            instructions: 'Monitor pulse rate daily',
          },
        ],
        labTestsRecommended: ['12-Lead ECG', 'Lipid Profile', 'Serum Creatinine'],
        clinicalNotes: 'Reduce dietary sodium and resume moderate aerobic walks.',
        followUpDate: '2026-11-15',
        isFinalized: false,
      });

    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe('DRAFT');
    expect(draftRes.body.data.version).toBe(1);

    // 14. Step 13: Doctor finalizes prescription -> COMPLETED appointment
    const finalizeRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: bookedAppointmentId,
        diagnosis: 'Mild Sinus Tachycardia, Borderline Hypertension',
        symptomsAndFindings: 'S1/S2 normal, no bruits. Resting ECG confirms regular sinus rhythm.',
        vitals: {
          bloodPressure: '135/88 mmHg',
          pulseRate: '88 bpm',
          temperature: '98.4 F',
          spO2: '99%',
          weight: '72 kg',
        },
        medications: [
          {
            name: 'Metoprolol Tartrate',
            dosage: '25 mg',
            frequency: '1-0-0 (Morning)',
            duration: '14 days',
            timing: 'After breakfast',
            instructions: 'Monitor pulse rate daily',
          },
          {
            name: 'Atorvastatin',
            dosage: '10 mg',
            frequency: '0-0-1 (Night)',
            duration: '30 days',
            timing: 'After dinner',
            instructions: 'Take consistently before sleep',
          },
        ],
        labTestsRecommended: ['12-Lead ECG', 'Lipid Profile', 'Serum Creatinine'],
        clinicalNotes: 'Patient counseled on lifestyle modifications and sodium restriction.',
        followUpDate: '2026-11-15',
        isFinalized: true,
      });

    expect(finalizeRes.status).toBe(201);
    expect(finalizeRes.body.data.status).toBe('FINALIZED');

    const completedAppt = await Appointment.findById(bookedAppointmentId);
    expect(completedAppt?.status).toBe('COMPLETED');

    // 15. Step 14: Doctor amends finalized prescription -> version increments & audit recorded
    const amendRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId: bookedAppointmentId,
        diagnosis: 'Mild Sinus Tachycardia, Borderline Hypertension (Adjusted)',
        symptomsAndFindings: 'Dose adjusted for enhanced night rest.',
        vitals: {
          bloodPressure: '132/84 mmHg',
          pulseRate: '82 bpm',
        },
        medications: [
          {
            name: 'Metoprolol Tartrate',
            dosage: '25 mg',
            frequency: '1-0-0',
            duration: '14 days',
            timing: 'After breakfast',
          },
        ],
        amendmentReason: 'Discontinued Statin pending baseline Lipid Profile report',
        isFinalized: true,
      });

    expect(amendRes.status).toBe(201);
    expect(amendRes.body.data.version).toBe(2);
    expect(amendRes.body.data.amendmentHistory.length).toBe(1);

    // 16. Step 15: Patient fetches prescription history & printable view
    const myRxRes = await request(app)
      .get('/api/prescriptions/my')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(myRxRes.status).toBe(200);
    expect(myRxRes.body.data.length).toBeGreaterThan(0);
    const rx = myRxRes.body.data[0];
    expect(rx.diagnosis).toContain('Sinus Tachycardia');

    const singleRxRes = await request(app)
      .get(`/api/prescriptions/${rx._id}`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(singleRxRes.status).toBe(200);
    expect(singleRxRes.body.data.doctor.firstName).toBe('Rajesh');
    expect(singleRxRes.body.data.patient.firstName).toBe('Aarav');

    // 17. Step 16: Complete token in queue
    const doneRes = await request(app)
      .patch(`/api/queue/${queueEntryId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'COMPLETED' });
    expect(doneRes.status).toBe(200);
    expect(doneRes.body.data.status).toBe('COMPLETED');
  });
});
