import { Router } from 'express';
import {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById,
  getPrescriptionByAppointment,
  downloadPrescriptionPdf,
} from '../controllers/prescriptionController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Doctor creates/updates draft or finalizes prescription
router.post(
  '/',
  authenticate,
  authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  createPrescription
);

// Patient or Doctor fetches their prescription history
router.get('/my', authenticate, getMyPrescriptions);

// Download A4 prescription PDF
router.get('/:id/pdf', authenticate, downloadPrescriptionPdf);
router.get('/appointment/:appointmentId/pdf', authenticate, downloadPrescriptionPdf);

// Fetch specific prescription by ID (includes populated details for viewing/printing)
router.get('/:id', authenticate, getPrescriptionById);

// Fetch prescription for a specific appointment
router.get('/appointment/:appointmentId', authenticate, getPrescriptionByAppointment);

export default router;
