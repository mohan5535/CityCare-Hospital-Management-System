import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5002', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3001',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hms',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true',
  ENABLE_DEMO_LOGINS: process.env.ENABLE_DEMO_LOGINS === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'hms-super-secret-jwt-key-change-in-production-2025',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_key',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
