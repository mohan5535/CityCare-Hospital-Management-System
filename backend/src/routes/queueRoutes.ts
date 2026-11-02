import { Router } from 'express';
import {
  checkIn,
  updateStatus,
  getPublicQueue,
  getClinicalQueue,
  recordDelay,
} from '../controllers/queueController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public token board
router.get('/public/:doctorId', getPublicQueue);

// Patient / Staff check-in
router.post('/checkin', authenticate, checkIn);

// Doctor & Receptionist queue operations
router.get(
  '/clinical',
  authenticate,
  authorize('DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  getClinicalQueue
);

router.post(
  '/delay',
  authenticate,
  authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  recordDelay
);

router.patch(
  '/:entryId/status',
  authenticate,
  authorize('DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  updateStatus
);

export default router;

