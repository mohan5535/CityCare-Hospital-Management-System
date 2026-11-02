import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
} from '../controllers/paymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/history', authenticate, getPaymentHistory);

export default router;

