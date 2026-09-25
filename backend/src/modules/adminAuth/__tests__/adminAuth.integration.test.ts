import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SuperAdmin } from '../superAdmin.model.js';
import adminAuthRoutes from '../adminAuth.routes.js';
import shopRoutes from '../../shop/shop.routes.js';
import { requireSuperAdmin } from '../../../middleware/requireSuperAdmin.middleware.js';
import { errorHandler } from '../../../middleware/errorHandler.js';
import { jest } from '@jest/globals';

let mongoServer: MongoMemoryServer;

const app = express();
app.use(express.json());

// Setup routes exactly like app.ts
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', requireSuperAdmin);
app.use('/api/admin/shops', shopRoutes);

app.use(errorHandler);

jest.setTimeout(600000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await SuperAdmin.deleteMany({});
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('super-secret', salt);
  
  await SuperAdmin.create({
    email: 'admin@rawnaq.com',
    passwordHash
  });
});

describe('SuperAdmin Authentication & Middleware Integration Suite', () => {

  it('A valid login returns a JWT', async () => {
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@rawnaq.com', password: 'super-secret' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();

    const decoded = jwt.verify(res.body.data.token, 'test-secret') as any;
    expect(decoded.role).toBe('superadmin');
  });

  it('An invalid login returns a generic 401', async () => {
    // Wrong password
    let res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@rawnaq.com', password: 'wrong-password' });
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');

    // Wrong email
    res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'fake@rawnaq.com', password: 'super-secret' });
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('Logs in as SuperAdmin and successfully calls SA-M01 and SA-M03 routes', async () => {
    const loginRes = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@rawnaq.com', password: 'super-secret' });
    
    const token = loginRes.body.data.token;

    // SA-M01 (Shops)
    const shopRes = await request(app)
      .get('/api/admin/shops')
      .set('Authorization', `Bearer ${token}`);
    
    expect(shopRes.status).toBe(200);
    expect(shopRes.body.status).toBe('success');

    // SA-M03 (Metrics)
    const metricsRes = await request(app)
      .get('/api/admin/shops/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.status).toBe('success');
  });

  it('Hitting ANY protected route with a tenant JWT returns 403', async () => {
    // Mock a valid tenant token
    const tenantToken = jwt.sign(
      { sub: 'some-tenant-id', role: 'owner' },
      'test-secret'
    );

    const endpoints = [
      { method: 'get', url: '/api/admin/shops' },
      { method: 'post', url: '/api/admin/shops' },
      { method: 'patch', url: '/api/admin/shops/123/status' },
      { method: 'get', url: '/api/admin/shops/metrics' }
    ] as const;

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.url).set('Authorization', `Bearer ${tenantToken}`);
      // Send dummy body to pass Zod parser for POST/PATCH if it gets that far (it shouldn't)
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    }
  });

  it('Hitting ANY protected route with missing/malformed token returns 401', async () => {
    const res = await request(app)
      .get('/api/admin/shops');

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Missing or malformed token');
  });

});
