import { Router } from 'express';
import { getDashboardStats, getAuditLogs } from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), getDashboardStats);
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), getAuditLogs);

export default router;

