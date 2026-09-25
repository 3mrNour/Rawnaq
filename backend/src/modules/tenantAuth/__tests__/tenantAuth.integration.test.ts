import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { StaffMember } from '../../staff/staff.model.js';
import tenantAuthRoutes from '../tenantAuth.routes.js';
import tenantRoutes from '../../tenant/tenant.routes.js';
import { errorHandler } from '../../../middleware/errorHandler.js';

let mongoServer: MongoMemoryServer;

const app = express();
app.use(express.json());

// Set up routes as in app.ts
process.env.JWT_SECRET = 'test_secret_key';
app.use('/api/tenant/auth', tenantAuthRoutes);
app.use('/api/tenant', tenantRoutes);
app.use(errorHandler);

jest.setTimeout(600000); // 10 minutes

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Shop.deleteMany({});
  await StaffMember.deleteMany({});
});

describe('Tenant Auth & Data Isolation Integration Suite', () => {
  
  it('Valid credentials return a correctly structured JWT', async () => {
    const shop = await Shop.create({
      name: 'Auth Test Shop',
      licenseKey: 'RWNQ-AUTH-TEST',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000), // tomorrow
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    const staff = await StaffMember.create({
      shopId: shop._id,
      name: 'Owner',
      email: 'owner@test.com',
      passwordHash,
      role: 'owner',
    });

    const res = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-AUTH-TEST',
        email: 'owner@test.com',
        password: 'password123',
        deviceFingerprint: 'DEVICE-1',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET as string) as any;
    expect(decoded.sub).toBe(staff._id.toString());
    expect(decoded.shopId).toBe(shop._id.toString());
    expect(decoded.role).toBe('owner');
  });

  it('First login successfully binds the deviceFingerprint to the Shop', async () => {
    const shop = await Shop.create({
      name: 'Device Test Shop',
      licenseKey: 'RWNQ-DEV-TEST',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000), // tomorrow
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    await StaffMember.create({
      shopId: shop._id,
      name: 'Owner',
      email: 'owner@devtest.com',
      passwordHash,
      role: 'owner',
    });

    // Login with fingerprint
    const res = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-DEV-TEST',
        email: 'owner@devtest.com',
        password: 'password123',
        deviceFingerprint: 'FINGERPRINT-BIND',
      });

    expect(res.status).toBe(200);

    // Verify it was bound
    const updatedShop = await Shop.findById(shop._id);
    expect(updatedShop?.deviceFingerprint).toBe('FINGERPRINT-BIND');
  });

  it('Second login with a different deviceFingerprint is rejected with 403 DEVICE_LOCKED', async () => {
    const shop = await Shop.create({
      name: 'Device Lock Shop',
      licenseKey: 'RWNQ-LOCK-TEST',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000), // tomorrow
      deviceFingerprint: 'FINGERPRINT-1', // already bound
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    await StaffMember.create({
      shopId: shop._id,
      name: 'Owner',
      email: 'owner@locktest.com',
      passwordHash,
      role: 'owner',
    });

    const res = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-LOCK-TEST',
        email: 'owner@locktest.com',
        password: 'password123',
        deviceFingerprint: 'FINGERPRINT-2', // Different
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DEVICE_LOCKED');
  });

  it('Data isolation: Mock route strictly uses JWT claims', async () => {
    const shopA = await Shop.create({
      name: 'Shop A',
      licenseKey: 'RWNQ-SHOP-A',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000),
    });

    const shopB = await Shop.create({
      name: 'Shop B',
      licenseKey: 'RWNQ-SHOP-B',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000),
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    const staffA = await StaffMember.create({
      shopId: shopA._id,
      name: 'Owner A',
      email: 'owner@shopa.com',
      passwordHash,
      role: 'owner',
    });

    // Login to get token for Shop A
    const loginRes = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-SHOP-A',
        email: 'owner@shopa.com',
        password: 'password123',
        deviceFingerprint: 'FINGERPRINT-A',
      });

    const tokenA = loginRes.body.data.token;

    // Call the test isolation route
    // Even if we send a different shopId in body, the router isolates based on JWT
    const isoRes = await request(app)
      .get('/api/tenant/test-isolation')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ shopId: shopB._id.toString() }); // Attempting to forge

    expect(isoRes.status).toBe(200);
    expect(isoRes.body.data.shopId).toBe(shopA._id.toString());
    expect(isoRes.body.data.staffId).toBe(staffA._id.toString());
  });

  it('Subscription check: suspended shop owner receives 403 SUBSCRIPTION_INACTIVE', async () => {
    const shop = await Shop.create({
      name: 'Suspended Shop',
      licenseKey: 'RWNQ-SUSPENDED',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000),
      subscriptionStatus: 'suspended',
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    await StaffMember.create({
      shopId: shop._id,
      name: 'Owner Suspended',
      email: 'owner@suspended.com',
      passwordHash,
      role: 'owner',
    });

    // We can still login to get a token (or maybe login should be blocked? The prompt didn't specify blocking login itself, but checkSubscription runs on downstream routes)
    const loginRes = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-SUSPENDED',
        email: 'owner@suspended.com',
        password: 'password123',
        deviceFingerprint: 'FINGERPRINT-SUSPENDED',
      });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    // Call any downstream tenant route
    const isoRes = await request(app)
      .get('/api/tenant/test-isolation')
      .set('Authorization', `Bearer ${token}`);

    expect(isoRes.status).toBe(403);
    expect(isoRes.body.code).toBe('SUBSCRIPTION_INACTIVE');
  });

  it('User Acceptance: Cross-tenant isolation and device lock enforcement', async () => {
    // Seed two shops (A, B), each with an owner account
    const shopA = await Shop.create({
      name: 'Shop A',
      licenseKey: 'RWNQ-USER-A',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000),
    });

    const shopB = await Shop.create({
      name: 'Shop B',
      licenseKey: 'RWNQ-USER-B',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 86400000),
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    const staffA = await StaffMember.create({
      shopId: shopA._id,
      name: 'Owner A',
      email: 'ownera@shop.com',
      passwordHash,
      role: 'owner',
    });

    const staffB = await StaffMember.create({
      shopId: shopB._id,
      name: 'Owner B',
      email: 'ownerb@shop.com',
      passwordHash,
      role: 'owner',
    });

    // 1. Log in as Shop A's owner from fingerprint 'device-1'
    const loginA = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-USER-A',
        email: 'ownera@shop.com',
        password: 'password123',
        deviceFingerprint: 'device-1',
      });

    expect(loginA.status).toBe(200);
    const tokenA = loginA.body.data.token;

    // 2. Attempt to fetch Shop B's staff list using Shop A's token
    const fetchStaff = await request(app)
      .get('/api/tenant/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ shopId: shopB._id.toString() }); // attempt forged parameter

    expect(fetchStaff.status).toBe(200);
    // Confirm the response never contains Shop B's real data
    const staffList = fetchStaff.body.data;
    expect(staffList.length).toBe(1);
    expect(staffList[0]._id).toBe(staffA._id.toString());
    expect(staffList[0].email).toBe('ownera@shop.com'); // Got Shop A data, not Shop B

    // 3. Attempt Shop A's owner login again from fingerprint 'device-2'
    const loginA2 = await request(app)
      .post('/api/tenant/auth/login')
      .send({
        shopLicenseKeyOrSlug: 'RWNQ-USER-A',
        email: 'ownera@shop.com',
        password: 'password123',
        deviceFingerprint: 'device-2',
      });

    // Confirm DEVICE_LOCKED
    expect(loginA2.status).toBe(403);
    expect(loginA2.body.code).toBe('DEVICE_LOCKED');
  });

});
