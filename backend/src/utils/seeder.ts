import mongoose from 'mongoose';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { config } from '../config/env';

export const seedDatabase = async () => {
  console.log('[Seeder] Checking clinical department foundation...');

  // 1. Seed Hospital Clinical Departments
  const departmentsData = [
    {
      name: 'General Medicine',
      slug: 'general-medicine',
      description: 'Comprehensive primary healthcare, routine checkups, and diagnostic triage.',
      icon: 'Stethoscope',
    },
    {
      name: 'Cardiology',
      slug: 'cardiology',
      description: 'Diagnosis and treatment of heart conditions, hypertension, and cardiovascular health.',
      icon: 'Heart',
    },
    {
      name: 'Neurology',
      slug: 'neurology',
      description: 'Specialized diagnosis of brain, spinal cord, and peripheral nerve disorders.',
      icon: 'Brain',
    },
    {
      name: 'Orthopedics',
      slug: 'orthopedics',
      description: 'Treatment of musculoskeletal system, bones, joints, ligaments, and fractures.',
      icon: 'Bone',
    },
    {
      name: 'Pediatrics',
      slug: 'pediatrics',
      description: 'Comprehensive medical care and developmental tracking for infants, children, and teens.',
      icon: 'Baby',
    },
    {
      name: 'Dermatology',
      slug: 'dermatology',
      description: 'Expert care for skin disorders, allergies, hair, and cosmetic wellness.',
      icon: 'Sparkles',
    },
    {
      name: 'ENT (Ear, Nose & Throat)',
      slug: 'ent',
      description: 'Care for hearing, sinus, voice, balance, and head & neck disorders.',
      icon: 'Ear',
    },
    {
      name: 'Gastroenterology',
      slug: 'gastroenterology',
      description: 'Digestive system, liver, gastrointestinal endoscopy, and metabolic health.',
      icon: 'Activity',
    },
  ];

  for (const dept of departmentsData) {
    await Department.findOneAndUpdate({ slug: dept.slug }, dept, { upsert: true });
  }

  console.log('[Seeder] Hospital departments verified.');

  // 2. Demo Accounts Seeding (Controlled strictly by ENABLE_DEMO_LOGINS environment variable)
  const isDemoEnabled = config.ENABLE_DEMO_LOGINS || process.env.ENABLE_DEMO_LOGINS === 'true';

  if (!isDemoEnabled) {
    console.log('[Seeder] Demo account seeding skipped (ENABLE_DEMO_LOGINS is disabled).');
    return;
  }

  console.log('[Seeder] Initializing demo accounts for local development and evaluator review...');

  // A. Super Admin: Vikram Mehta
  let superAdmin = await User.findOne({ email: 'superadmin@hms.com' }).select('+password');
  if (!superAdmin) {
    superAdmin = await User.create({
      email: 'superadmin@hms.com',
      password: 'AdminPass123!',
      firstName: 'Vikram',
      lastName: 'Mehta',
      role: 'SUPER_ADMIN',
      phone: '+91 98765 43210',
      status: 'ACTIVE',
    });
  } else {
    const isMatch = await superAdmin.comparePassword('AdminPass123!');
    if (!isMatch || superAdmin.status !== 'ACTIVE') {
      superAdmin.password = 'AdminPass123!';
      superAdmin.status = 'ACTIVE';
      await superAdmin.save();
    }
  }

  // B. Hospital Admin: Kavita Singhania
  let hospitalAdmin = await User.findOne({ email: 'admin@hms.com' }).select('+password');
  if (!hospitalAdmin) {
    hospitalAdmin = await User.create({
      email: 'admin@hms.com',
      password: 'AdminPass123!',
      firstName: 'Kavita',
      lastName: 'Singhania',
      role: 'HOSPITAL_ADMIN',
      phone: '+91 98765 43211',
      status: 'ACTIVE',
    });
  } else {
    const isMatch = await hospitalAdmin.comparePassword('AdminPass123!');
    if (!isMatch || hospitalAdmin.status !== 'ACTIVE') {
      hospitalAdmin.password = 'AdminPass123!';
      hospitalAdmin.status = 'ACTIVE';
      await hospitalAdmin.save();
    }
  }

  // C. Front-desk Staff / Receptionist: Sunita Rao
  let receptionist = await User.findOne({ email: 'receptionist@hms.com' }).select('+password');
  if (!receptionist) {
    receptionist = await User.create({
      email: 'receptionist@hms.com',
      password: 'ReceptPass123!',
      firstName: 'Sunita',
      lastName: 'Rao',
      role: 'RECEPTIONIST',
      phone: '+91 98765 43212',
      status: 'ACTIVE',
    });
  } else {
    const isMatch = await receptionist.comparePassword('ReceptPass123!');
    if (!isMatch || receptionist.status !== 'ACTIVE') {
      receptionist.password = 'ReceptPass123!';
      receptionist.status = 'ACTIVE';
      await receptionist.save();
    }
  }

  // D. Patient: Rahul Deshmukh
  let patientUser = await User.findOne({ email: 'patient@hms.com' }).select('+password');
  if (!patientUser) {
    patientUser = await User.create({
      email: 'patient@hms.com',
      password: 'PatientPass123!',
      firstName: 'Rahul',
      lastName: 'Deshmukh',
      role: 'PATIENT',
      phone: '+91 98765 43213',
      status: 'ACTIVE',
    });
  } else {
    const isMatch = await patientUser.comparePassword('PatientPass123!');
    if (!isMatch || patientUser.status !== 'ACTIVE') {
      patientUser.password = 'PatientPass123!';
      patientUser.status = 'ACTIVE';
      await patientUser.save();
    }
  }

  // Ensure PatientProfile exists
  if (patientUser) {
    const existingPatientProfile = await PatientProfile.findOne({ user: patientUser._id });
    if (!existingPatientProfile) {
      await PatientProfile.create({
        user: patientUser._id,
        gender: 'MALE',
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
        chronicConditions: ['Mild Asthma'],
        address: '104, Green Valley Apartments, Metro City',
        emergencyContact: {
          name: 'Neha Deshmukh',
          relationship: 'Spouse',
          phone: '+91 98765 43299',
        },
      });
    }
  }

  // E. Hospital Doctors Seeding across Clinical Departments
  const doctorsData = [
    {
      email: 'dr.priya@hms.com',
      password: 'DoctorPass123!',
      firstName: 'Dr. Priya',
      lastName: 'Sharma',
      phone: '+91 98765 43214',
      deptSlug: 'cardiology',
      licenseNumber: 'MCI-CARD-8921',
      specialization: ['Interventional Cardiology', 'Heart Failure Management'],
      qualifications: ['MBBS', 'MD (Cardiology)', 'FACC'],
      experienceYears: 14,
      consultationFee: 800,
      bio: 'Senior Interventional Cardiologist with over 14 years of clinical experience in leading healthcare institutes.',
      teleconsultationEnabled: true,
      averageRating: 4.9,
      totalReviews: 86,
    },
    {
      email: 'dr.rajesh@hms.com',
      password: 'DoctorPass123!',
      firstName: 'Dr. Rajesh',
      lastName: 'Verma',
      phone: '+91 98765 43215',
      deptSlug: 'neurology',
      licenseNumber: 'MCI-NEUR-5412',
      specialization: ['Neurology & Stroke Medicine', 'Epilepsy Care', 'Headache Management'],
      qualifications: ['MBBS', 'MD (General Medicine)', 'DM (Neurology)'],
      experienceYears: 18,
      consultationFee: 1200,
      bio: 'Renowned Neurologist specialized in acute stroke recovery, migraine clinics, and neuromuscular disorders.',
      teleconsultationEnabled: true,
      averageRating: 4.9,
      totalReviews: 124,
    },
    {
      email: 'dr.ananya@hms.com',
      password: 'DoctorPass123!',
      firstName: 'Dr. Ananya',
      lastName: 'Iyer',
      phone: '+91 98765 43216',
      deptSlug: 'pediatrics',
      licenseNumber: 'MCI-PED-7834',
      specialization: ['Pediatrics & Neonatal Care', 'Infant Nutrition', 'Immunization'],
      qualifications: ['MBBS', 'MD (Pediatrics)', 'DNB (Neonatology)'],
      experienceYears: 10,
      consultationFee: 600,
      bio: 'Compassionate Pediatrician dedicated to neonatal intensive care, preventive vaccinations, and childhood milestones.',
      teleconsultationEnabled: true,
      averageRating: 4.8,
      totalReviews: 98,
    },
    {
      email: 'dr.amit@hms.com',
      password: 'DoctorPass123!',
      firstName: 'Dr. Amit',
      lastName: 'Patel',
      phone: '+91 98765 43217',
      deptSlug: 'orthopedics',
      licenseNumber: 'MCI-ORTH-9023',
      specialization: ['Orthopedic Surgery & Trauma', 'Joint Replacement', 'Arthroscopy'],
      qualifications: ['MBBS', 'MS (Orthopedics)', 'MCh (Orth)'],
      experienceYears: 15,
      consultationFee: 900,
      bio: 'Expert Orthopedic Surgeon specialized in robotic total knee & hip replacement and minimally invasive sports trauma care.',
      teleconsultationEnabled: true,
      averageRating: 4.9,
      totalReviews: 112,
    },
    {
      email: 'dr.vikram.j@hms.com',
      password: 'DoctorPass123!',
      firstName: 'Dr. Vikram',
      lastName: 'Joshi',
      phone: '+91 98765 43218',
      deptSlug: 'general-medicine',
      licenseNumber: 'MCI-GEN-3341',
      specialization: ['Internal Medicine', 'Preventive Health', 'Metabolic Syndrome'],
      qualifications: ['MBBS', 'MD (Internal Medicine)'],
      experienceYears: 12,
      consultationFee: 500,
      bio: 'Primary care specialist focusing on evidence-based chronic condition triage, preventive screenings, and diabetes wellness.',
      teleconsultationEnabled: true,
      averageRating: 4.7,
      totalReviews: 74,
    },
    {
      email: 'dr.sunita.k@hms.com',
      password: 'DoctorPass123!',
      firstName: 'Dr. Sunita',
      lastName: 'Kulkarni',
      phone: '+91 98765 43219',
      deptSlug: 'dermatology',
      licenseNumber: 'MCI-DERM-4190',
      specialization: ['Clinical Dermatology', 'Cosmetic Skin Wellness', 'Allergy Diagnostics'],
      qualifications: ['MBBS', 'MD (Dermatology, Venereology & Leprosy)'],
      experienceYears: 11,
      consultationFee: 750,
      bio: 'Experienced Dermatologist offering comprehensive clinical management of inflammatory dermatoses and aesthetic skin therapies.',
      teleconsultationEnabled: true,
      averageRating: 4.8,
      totalReviews: 82,
    },
  ];

  for (const doc of doctorsData) {
    const dept = await Department.findOne({ slug: doc.deptSlug });
    if (!dept) continue;

    let docUser = await User.findOne({ email: doc.email }).select('+password');
    if (!docUser) {
      docUser = await User.create({
        email: doc.email,
        password: doc.password,
        firstName: doc.firstName,
        lastName: doc.lastName,
        role: 'DOCTOR',
        phone: doc.phone,
        status: 'ACTIVE',
      });
    } else {
      const isMatch = await docUser.comparePassword(doc.password);
      if (!isMatch || docUser.status !== 'ACTIVE') {
        docUser.password = doc.password;
        docUser.status = 'ACTIVE';
        await docUser.save();
      }
    }

    let docProfile = await DoctorProfile.findOne({ user: docUser._id });
    if (!docProfile) {
      docProfile = await DoctorProfile.create({
        user: docUser._id,
        department: dept._id,
        licenseNumber: doc.licenseNumber,
        specialization: doc.specialization,
        qualifications: doc.qualifications,
        experienceYears: doc.experienceYears,
        consultationFee: doc.consultationFee,
        bio: doc.bio,
        teleconsultationEnabled: doc.teleconsultationEnabled,
        verificationStatus: 'VERIFIED',
        averageRating: doc.averageRating,
        totalReviews: doc.totalReviews,
      });
    } else if (docProfile.verificationStatus !== 'VERIFIED') {
      docProfile.verificationStatus = 'VERIFIED';
      docProfile.department = dept._id;
      await docProfile.save();
    }

    // Availability schedule (Monday to Saturday, 09:00 to 17:00)
    for (let day = 1; day <= 6; day++) {
      const existingAvail = await DoctorAvailability.findOne({
        doctor: docUser._id,
        dayOfWeek: day,
      });
      if (!existingAvail) {
        await DoctorAvailability.create({
          doctor: docUser._id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          breakTimes: [{ startTime: '13:00', endTime: '14:00' }],
          isActive: true,
        });
      }
    }
  }

  console.log('[Seeder] Hospital clinical doctors verified without duplicates.');
};
