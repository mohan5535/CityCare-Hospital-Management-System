import { Request, Response } from 'express';
import {
  createPaymentOrder,
  verifyPaymentSignature,
  processRazorpayWebhook,
} from '../services/paymentService';
import { Payment } from '../models/Payment';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const createOrder = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const { appointmentId, idempotencyKey } = req.body;
    if (!appointmentId) {
      return sendError(res, 'appointmentId is required', 400);
    }

    const order = await createPaymentOrder({
      appointmentId,
      patientId: req.user._id.toString(),
      idempotencyKey,
    });

    return sendSuccess(res, order, 'Payment order created', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create payment order', 400);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const { appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!appointmentId || !razorpayOrderId || !razorpayPaymentId) {
      return sendError(
        res,
        'appointmentId, razorpayOrderId, and razorpayPaymentId are required',
        400
      );
    }

    const payment = await verifyPaymentSignature({
      appointmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      patientId: req.user._id.toString(),
    });

    return sendSuccess(res, payment, 'Payment verified successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Payment verification failed', 400);
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return sendError(res, 'Missing webhook signature header', 400);
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await processRazorpayWebhook(rawBody, signature);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]', error);
    return sendError(res, error.message || 'Webhook processing failed', 400);
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const filter: any = {};
    if (req.user.role === 'PATIENT') {
      filter.patient = req.user._id;
    } else if (!['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role)) {
      return sendError(res, 'Access denied', 403);
    }

    const payments = await Payment.find(filter)
      .populate('appointment')
      .populate('patient', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, payments, 'Payment history retrieved');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch payment history', 500);
  }
};

