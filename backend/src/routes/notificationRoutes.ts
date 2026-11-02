import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markAsRead);

export default router;

