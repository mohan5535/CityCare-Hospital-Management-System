import { Router } from 'express';
import {
  searchDoctors,
  getDoctorById,
  getAllDoctorsAdmin,
  verifyDoctor,
  updateDoctorProfile,
} from '../controllers/doctorController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public doctor discovery
router.get('/', searchDoctors);
router.get('/:id', getDoctorById);

// Admin-only doctor management & verification
router.get('/admin/all', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), getAllDoctorsAdmin);
router.patch('/admin/verify/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), verifyDoctor);

// Doctor updates their own profile or Admin updates doctor profile
router.put('/:id', authenticate, authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), updateDoctorProfile);

export default router;

