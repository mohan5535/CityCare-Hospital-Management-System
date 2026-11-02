import { Router } from 'express';
import { join, claim, getMyWaitlist } from '../controllers/waitlistController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/join', authenticate, join);
router.post('/claim', authenticate, claim);
router.get('/my', authenticate, getMyWaitlist);

export default router;

