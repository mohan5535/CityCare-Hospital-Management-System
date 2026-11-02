import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { DoctorProfile } from '../src/models/DoctorProfile';
import { Department } from '../src/models/Department';
import { Appointment } from '../src/models/Appointment';

const app = createApp();

describe('Doctor Consultation & Digital Prescription End-to-End Suite', () => {
  it('executes full consultation lifecycle, draft protection, PDF generation, and security boundaries', async () => {
    // 1. Setup Department
    const dept = await Department.create({
      name: 'Pulmonology & Respiratory Care',
      slug: 'pulmonology-care',
      description: 'Advanced respiratory and thoracic clinic',
      consultationFee: 850,
      icon: 'Lungs',
    });

    // 2. Setup Authorized Doctor 1
    const doctorUser = await User.create({
      firstName: 'Ananya',
      lastName: 'Desai',
      email: 'dr.ananya.desai@hms.com',
      password: 'SecureDoctorPass123!',
      role: 'DOCTOR',
      phone: '+919811223344',
    });

    await DoctorProfile.create({
      user: doctorUser._id,
      department: dept._id,
      licenseNumber: 'MCI-PULM-7741',
      specialization: ['Interventional Pulmonology', 'Asthma Care'],
      qualifications: ['MBBS', 'MD (Pulmonary Medicine)'],
      experienceYears: 12,
      consultationFee: 850,
      verificationStatus: 'VERIFIED',
      bio: 'Senior Consultant Pulmonologist',
    });

    const docLoginRes = await request(app).post('/api/auth/login').send({
      email: 'dr.ananya.desai@hms.com',
      password: 'SecureDoctorPass123!',
    });
    const doctorToken = docLoginRes.body.data.token;
    const doctorId = doctorUser._id.toString();

    // 3. Setup Unauthorized Doctor 2
    const rogueDocUser = await User.create({
      firstName: 'Vikram',
      lastName: 'Malhotra',
      email: 'dr.vikram.rogue@hms.com',
      password: 'SecureDoctorPass123!',
      role: 'DOCTOR',
      phone: '+919933445566',
    });
    await DoctorProfile.create({
      user: rogueDocUser._id,
      department: dept._id,
      licenseNumber: 'MCI-PULM-9988',
      specialization: ['General Medicine'],
      qualifications: ['MBBS'],
      experienceYears: 5,
      consultationFee: 500,
      verificationStatus: 'VERIFIED',
    });
    const rogueDocLoginRes = await request(app).post('/api/auth/login').send({
      email: 'dr.vikram.rogue@hms.com',
      password: 'SecureDoctorPass123!',
    });
    const rogueDoctorToken = rogueDocLoginRes.body.data.token;

    // 4. Setup Patient 1 (Primary)
    const patientRegRes = await request(app).post('/api/auth/register').send({
      firstName: 'Rohan',
      lastName: 'Mehta',
      email: 'rohan.mehta@example.com',
      password: 'PatientPassword123!',
      role: 'PATIENT',
      phone: '+919876500112',
    });
    const patientToken = patientRegRes.body.data.token;

    // 5. Setup Patient 2 (Unauthorized Patient)
    const otherPatientRes = await request(app).post('/api/auth/register').send({
      firstName: 'Neha',
      lastName: 'Kapoor',
      email: 'neha.kapoor@example.com',
      password: 'PatientPassword123!',
      role: 'PATIENT',
      phone: '+919876500999',
    });
    const otherPatientToken = otherPatientRes.body.data.token;

    // 6. Step 1: Patient 1 books appointment
    const today = new Date().toISOString().split('T')[0];
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        appointmentDate: today,
        startTime: '11:00',
        endTime: '11:15',
        type: 'IN_PERSON',
        reasonForVisit: 'Persistent dry cough and mild wheezing',
        symptomsSummary: 'Symptoms worsening at night for past 2 weeks',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.appointmentReference).toMatch(/^APT-\d{4}-\d{6}$/);
    const appointmentId = bookRes.body.data._id;
    const appointmentRef = bookRes.body.data.appointmentReference;

    // 7. Step 2: Doctor sees appointment in Doctor Dashboard
    const docApptsRes = await request(app)
      .get('/api/appointments/my?scope=today')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docApptsRes.status).toBe(200);
    const foundDocAppt = docApptsRes.body.data.find((a: any) => a._id === appointmentId);
    expect(foundDocAppt).toBeDefined();
    expect(foundDocAppt.patient.firstName).toBe('Rohan');

    // 8. Step 3: Patient sees appointment in Patient Appointments (prescription is null)
    const patApptsRes = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patApptsRes.status).toBe(200);
    const foundPatAppt = patApptsRes.body.data.find((a: any) => a._id === appointmentId);
    expect(foundPatAppt).toBeDefined();
    expect(foundPatAppt.status).toBe('CONFIRMED');
    expect(foundPatAppt.prescription).toBeNull();

    // 9. Step 4: Check In Patient
    const checkInRes = await request(app)
      .post(`/api/appointments/${appointmentId}/check-in`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(checkInRes.status).toBe(200);

    // 10. Step 5: Security Boundary - Unauthorized doctor cannot start consultation
    const unauthorizedStartRes = await request(app)
      .post(`/api/appointments/${appointmentId}/start-consultation`)
      .set('Authorization', `Bearer ${rogueDoctorToken}`);
    expect(unauthorizedStartRes.status).toBe(403);

    // 11. Step 6: Authorized Doctor starts consultation
    const startConsultRes = await request(app)
      .post(`/api/appointments/${appointmentId}/start-consultation`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(startConsultRes.status).toBe(200);
    expect(startConsultRes.body.data.status).toBe('IN_CONSULTATION');
    expect(startConsultRes.body.data.consultationStartedAt).toBeDefined();

    // 12. Step 7: Patient sees status transition to IN_CONSULTATION
    const inConsultApptRes = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(inConsultApptRes.status).toBe(200);
    expect(inConsultApptRes.body.data.status).toBe('IN_CONSULTATION');

    // 13. Step 8: Doctor saves DRAFT prescription
    const draftRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        diagnosis: 'Acute Bronchial Hyperresponsiveness',
        symptomsAndFindings: 'Bilateral mild expiratory wheezes, clear vesicular breath sounds',
        vitals: {
          bloodPressure: '122/78 mmHg',
          pulseRate: '76 bpm',
          temperature: '98.6 F',
          spO2: '98%',
          weight: '68 kg',
        },
        medications: [
          {
            name: 'Levosalbutamol Inhaler',
            dosage: '50 mcg',
            route: 'Inhalation',
            frequency: '2 puffs SOS',
            duration: 'As needed',
            timing: 'When coughing',
            quantity: '1 Inhaler',
            instructions: 'Rinse mouth after use',
          },
        ],
        clinicalNotes: 'Avoid dusty environments and cold water',
        isFinalized: false, // DRAFT
      });
    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe('DRAFT');
    const prescriptionId = draftRes.body.data._id;

    // 14. Step 9: Draft Protection - Patient CANNOT view or download unfinalized draft
    const patDraftViewRes = await request(app)
      .get(`/api/prescriptions/appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patDraftViewRes.status).toBe(403);

    const patDraftPdfRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patDraftPdfRes.status).toBe(403);

    // 15. Step 10: Doctor finalizes prescription
    const finalizeRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        diagnosis: 'Acute Bronchial Hyperresponsiveness with Mild Asthma',
        symptomsAndFindings: 'Bilateral expiratory wheezes, normal peak flow response',
        vitals: {
          bloodPressure: '122/78 mmHg',
          pulseRate: '76 bpm',
          temperature: '98.6 F',
          spO2: '98%',
          weight: '68 kg',
        },
        medications: [
          {
            name: 'Levosalbutamol + Ipratropium Inhaler',
            dosage: '50 mcg / 20 mcg',
            route: 'Inhalation',
            frequency: '2 puffs twice daily',
            duration: '14 days',
            timing: 'Morning and Evening',
            quantity: '1 Inhaler',
            instructions: 'Rinse mouth with water after inhalation',
          },
          {
            name: 'Montelukast Sodium',
            dosage: '10 mg',
            route: 'Oral',
            frequency: '0-0-1 (Night)',
            duration: '14 days',
            timing: 'After dinner',
            quantity: '14 Tablets',
            instructions: 'Take at bedtime',
          },
        ],
        labTestsRecommended: ['Complete Hemogram (CBC)', 'Spirometry with Reversibility'],
        clinicalNotes: 'Steam inhalation twice daily. Avoid allergen triggers.',
        additionalAdvice: 'Hydrate well with warm water.',
        followUpDate: '2026-11-20',
        isFinalized: true, // FINALIZED
      });

    expect(finalizeRes.status).toBe(201);
    expect(finalizeRes.body.data.status).toBe('FINALIZED');
    expect(finalizeRes.body.data.version).toBe(1);

    // 16. Step 11: Doctor completes consultation
    const completeConsultRes = await request(app)
      .post(`/api/appointments/${appointmentId}/complete-consultation`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ notes: 'Patient counseled on inhaler technique and trigger avoidance.' });

    expect(completeConsultRes.status).toBe(200);
    expect(completeConsultRes.body.data.status).toBe('COMPLETED');
    expect(completeConsultRes.body.data.consultationEndedAt).toBeDefined();

    // 17. Step 12: Patient sees appointment status COMPLETED and populated prescription
    const patCompletedApptsRes = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patCompletedApptsRes.status).toBe(200);
    const completedPatAppt = patCompletedApptsRes.body.data.find(
      (a: any) => a._id === appointmentId
    );
    expect(completedPatAppt.status).toBe('COMPLETED');
    expect(completedPatAppt.prescription).not.toBeNull();
    expect(completedPatAppt.prescription.status).toBe('FINALIZED');
    expect(completedPatAppt.prescription.followUpDate).toBe('2026-11-20');

    // 18. Step 13: Patient downloads authentic prescription PDF
    const pdfRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain('CityCare-Prescription-');
    // Verify valid PDF file signature (%PDF-)
    expect(pdfRes.body.slice(0, 5).toString()).toBe('%PDF-');

    // 19. Step 14: Security Boundary - Unauthorized Patient 2 CANNOT download Patient 1's prescription
    const roguePatPdfRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer ${otherPatientToken}`);
    expect(roguePatPdfRes.status).toBe(403);

    // 20. Step 15: Doctor downloads authentic prescription PDF directly via prescription ID
    const docPdfRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docPdfRes.status).toBe(200);
    expect(docPdfRes.headers['content-type']).toBe('application/pdf');
    expect(docPdfRes.body.slice(0, 5).toString()).toBe('%PDF-');

    // 21. Step 16: Doctor downloads prescription PDF via appointment ID route
    const docApptPdfRes = await request(app)
      .get(`/api/prescriptions/appointment/${appointmentId}/pdf`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docApptPdfRes.status).toBe(200);
    expect(docApptPdfRes.headers['content-type']).toBe('application/pdf');
    expect(docApptPdfRes.body.slice(0, 5).toString()).toBe('%PDF-');

    // 22. Step 17: Download prescription PDF using appointment reference string
    const docRefPdfRes = await request(app)
      .get(`/api/prescriptions/${appointmentRef}/pdf`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docRefPdfRes.status).toBe(200);
    expect(docRefPdfRes.headers['content-type']).toBe('application/pdf');

    // 23. Step 18: Download with quoted token string and redundant Bearer prefixes
    const docQuotedTokenRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer "${doctorToken}"`);
    expect(docQuotedTokenRes.status).toBe(200);

    const docDoubleBearerRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer Bearer ${doctorToken}`);
    expect(docDoubleBearerRes.status).toBe(200);

    const docLowercaseBearerRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `bearer ${doctorToken}`);
    expect(docLowercaseBearerRes.status).toBe(200);

    // 24. Step 19: Doctor ID Mapping - Verify appointment assigned to DoctorProfile._id is returned to doctor
    const docProfile = await DoctorProfile.findOne({ user: doctorId });
    expect(docProfile).toBeDefined();
    const profileMappedAppt = await Appointment.create({
      appointmentReference: 'APT-2026-PROFILE-MAP',
      patient: patientRegRes.body.data.user.id,
      doctor: docProfile?._id, // Assign to DoctorProfile._id instead of User._id
      department: dept._id,
      appointmentDate: today,
      startTime: '15:00',
      endTime: '15:15',
      type: 'IN_PERSON',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      consultationFee: 850,
      reasonForVisit: 'Testing doctor ID profile mapping query',
    });

    const docMappedApptsRes = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docMappedApptsRes.status).toBe(200);
    const foundMappedAppt = docMappedApptsRes.body.data.find(
      (a: any) => a.appointmentReference === 'APT-2026-PROFILE-MAP'
    );
    expect(foundMappedAppt).toBeDefined();

    // 24. Step 19: Security Boundary - Unauthorized Doctor 2 CANNOT download Doctor 1's prescription
    const rogueDocPdfRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', `Bearer ${rogueDoctorToken}`);
    expect(rogueDocPdfRes.status).toBe(403);
    expect(rogueDocPdfRes.body.message).toContain('You do not have permission to download this prescription');

    // 25. Step 20: Unauthenticated request rejected with 401
    const unauthPdfRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`);
    expect(unauthPdfRes.status).toBe(401);
    expect(unauthPdfRes.body.message).toContain('Authentication required. No token provided.');

    // 26. Step 21: String 'null' or 'undefined' token rejected with 401
    const nullTokenRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', 'Bearer null');
    expect(nullTokenRes.status).toBe(401);
    expect(nullTokenRes.body.message).toContain('Authentication required. No token provided.');

    // 27. Step 22: Malformed or forged token rejected with 401 'Invalid authentication token.'
    const forgedTokenRes = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/pdf`)
      .set('Authorization', 'Bearer forged.tampered.token');
    expect(forgedTokenRes.status).toBe(401);
    expect(forgedTokenRes.body.message).toBe('Invalid authentication token.');

    // 28. Step 23: View Rx action via appointment endpoint
    const viewRxDocRes = await request(app)
      .get(`/api/prescriptions/appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(viewRxDocRes.status).toBe(200);
    expect(viewRxDocRes.body.data.diagnosis).toBe('Acute Bronchial Hyperresponsiveness with Mild Asthma');

    const rogueDocViewRxRes = await request(app)
      .get(`/api/prescriptions/appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${rogueDoctorToken}`);
    expect(rogueDocViewRxRes.status).toBe(403);

    // 29. Step 24: Prescription Amendment Versioning
    const amendRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        diagnosis: 'Acute Bronchial Hyperresponsiveness with Mild Asthma (Adjusted)',
        vitals: { bloodPressure: '120/75 mmHg' },
        medications: [
          {
            name: 'Levosalbutamol Inhaler',
            dosage: '50 mcg',
            route: 'Inhalation',
            frequency: '1 puff SOS',
            duration: '7 days',
            timing: 'As needed',
          },
        ],
        amendmentReason: 'Symptoms stabilized; tapered off oral montelukast',
        isFinalized: true,
      });

    expect(amendRes.status).toBe(201);
    expect(amendRes.body.data.version).toBe(2);
    expect(amendRes.body.data.amendmentHistory.length).toBe(1);
    expect(amendRes.body.data.amendmentHistory[0].reason).toContain('tapered off oral montelukast');
  });
});

