import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// Route Imports
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import doctorRoutes from './routes/doctorRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import queueRoutes from './routes/queueRoutes';
import waitlistRoutes from './routes/waitlistRoutes';
import paymentRoutes from './routes/paymentRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import path from 'path';
import fs from 'fs';

export const createApp = (): Express => {
  const app = express();

  // Ensure uploads directory exists and mount static serving
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // For easier dev & Swagger rendering
    })
  );

  // Permissive CORS for local development
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin === config.CLIENT_URL
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'Idempotency-Key'],
    })
  );
  app.options('*', cors());

  // Capture rawBody for webhook HMAC signature verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
      limit: '10mb',
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (config.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health-check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'UP' : 'DEGRADED',
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // API Documentation endpoint info
  app.get('/api/docs', (_req: Request, res: Response) => {
    res.json({
      name: 'HMS REST API Documentation',
      version: '1.0.0',
      description: 'Comprehensive Hospital Appointment Booking & Management API',
      endpoints: {
        auth: '/api/auth [register, login, me]',
        departments: '/api/departments [list, create, update]',
        doctors: '/api/doctors [search, details, verify]',
        availability: '/api/availability [schedule, slots, block]',
        appointments: '/api/appointments [book, my, cancel, reschedule]',
        queue: '/api/queue [checkin, public, clinical, status]',
        waitlist: '/api/waitlist [join, claim, my]',
        payments: '/api/payments [create-order, verify, webhook, history]',
        prescriptions: '/api/prescriptions [create, by-appointment]',
        ai: '/api/ai [triage]',
        admin: '/api/admin [stats, audit-logs]',
        notifications: '/api/notifications [my, read]',
      },
    });
  });

  // API Routes Mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/upload', uploadRoutes);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

