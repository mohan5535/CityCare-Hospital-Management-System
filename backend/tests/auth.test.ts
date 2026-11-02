import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Authentication & Authorization Suite', () => {
  it('should successfully register a patient with valid password and profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient.test@hms.com',
        password: 'Password123!',
        firstName: 'Aarav',
        lastName: 'Sharma',
        phone: '+91 9988776655',
        role: 'PATIENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('patient.test@hms.com');
    expect(res.body.data.user.role).toBe('PATIENT');
  });

  it('should reject registration if email is already registered', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@hms.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'PATIENT',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@hms.com',
        password: 'Password123!',
        firstName: 'Test2',
        lastName: 'User2',
        role: 'PATIENT',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully login and return JWT token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login.test@hms.com',
        password: 'Password123!',
        firstName: 'Deepak',
        lastName: 'Kumar',
        role: 'PATIENT',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login.test@hms.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('login.test@hms.com');
  });

  it('should reject access to protected endpoint without bearer token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

