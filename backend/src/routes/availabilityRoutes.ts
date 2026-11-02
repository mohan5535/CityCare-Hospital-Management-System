import { Router } from 'express';
import {
  setWeeklySchedule,
  getDoctorSchedule,
  getAvailableSlots,
  blockSlot,
} from '../controllers/availabilityController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public slot lookup
router.get('/slots', getAvailableSlots);
router.get('/schedule/:doctorId', getDoctorSchedule);

// Doctor & Admin schedule controls
router.post('/schedule', authenticate, authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), setWeeklySchedule);
router.post('/block', authenticate, authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), blockSlot);

export default router;

