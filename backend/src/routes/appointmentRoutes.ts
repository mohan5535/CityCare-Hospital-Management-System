import { Router } from 'express';
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  checkInAppointmentHandler,
  startConsultationHandler,
  completeConsultationHandler,
  cancelAppointmentHandler,
  rescheduleAppointmentHandler,
  getAllAppointmentsAdmin,
} from '../controllers/appointmentController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, createAppointment);
router.get('/my', authenticate, getMyAppointments);
router.get(
  '/admin/all',
  authenticate,
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'),
  getAllAppointmentsAdmin
);
router.get('/:id', authenticate, getAppointmentById);
router.post('/:id/check-in', authenticate, checkInAppointmentHandler);
router.post(
  '/:id/start-consultation',
  authenticate,
  authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  startConsultationHandler
);
router.post(
  '/:id/complete-consultation',
  authenticate,
  authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  completeConsultationHandler
);
router.post('/:id/cancel', authenticate, cancelAppointmentHandler);
router.post('/:id/reschedule', authenticate, rescheduleAppointmentHandler);

export default router;
