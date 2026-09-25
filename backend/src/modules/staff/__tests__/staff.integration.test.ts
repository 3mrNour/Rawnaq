import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { StaffMember } from '../staff.model.js';
import tenantRoutes from '../../tenant/tenant.routes.js';
import { errorHandler } from '../../../middleware/errorHandler.js';
import * as staffService from '../staff.service.js';
import staffRoutes from '../staff.routes.js';

let mongoServer: MongoMemoryServer;

const app = express();
app.use(express.json());

process.env.JWT_SECRET = 'test_secret_key';

// Mock auth directly for easier role testing without doing full login dance
const mockAuth = (role: 'owner' | 'cashier', shopId: string) => {
  return (req: Request, res: Response, next: any) => {
    req.staffRole = role;
    req.shopId = shopId;
    next();
  };
};

// Apply router to test both service layer and routes
// We bypass `requireTenantAuth` by placing `mockAuth` in front of our routes
app.use('/api/tenant/staff-owner', mockAuth('owner', 'MOCK_SHOP_ID'), staffRoutes);
app.use('/api/tenant/staff-cashier', mockAuth('cashier', 'MOCK_SHOP_ID'), staffRoutes);
app.use(errorHandler);

jest.setTimeout(600000); // 10 minutes

let mockShopId: mongoose.Types.ObjectId;

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

describe('StaffMember Model & Role-Gated CRUD Integration Suite', () => {

  it('A ValidationError is thrown when creating a worker without pay fields', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-TEST-1',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });

    const staffData = {
      shopId: shop._id,
      name: 'Worker 1',
      workerType: 'dry-cleaner',
      pinCode: '1234'
    };

    let error: any;
    try {
      await StaffMember.create(staffData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('payType and payValue are required');
  });

  it('The compound index (shopId, pinCode) successfully rejects duplicates within the same shop', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-TEST-2',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });

    await StaffMember.create({
      shopId: shop._id,
      name: 'Worker 1',
      workerType: 'none',
      pinCode: '9999'
    });

    let error: any;
    try {
      await StaffMember.create({
        shopId: shop._id,
        name: 'Worker 2',
        workerType: 'none',
        pinCode: '9999'
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB Duplicate Key Error
  });

  it('A Cashier token receives a 403 on POST/PATCH/DELETE routes', async () => {
    // Attempt POST
    let res = await request(app).post('/api/tenant/staff-cashier').send({ name: 'Test' });
    expect(res.status).toBe(403);
    
    // Attempt PATCH
    res = await request(app).patch('/api/tenant/staff-cashier/123').send({ name: 'Test' });
    expect(res.status).toBe(403);

    // Attempt DELETE
    res = await request(app).delete('/api/tenant/staff-cashier/123');
    expect(res.status).toBe(403);
  });

  it('An Owner token can successfully create and update a worker\'s pay fields', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-TEST-3',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });
    const shopIdStr = shop._id.toString();

    // Re-mount app specifically for this shopId
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/staff', mockAuth('owner', shopIdStr), staffRoutes);
    testApp.use(errorHandler);

    // Create
    const createRes = await request(testApp).post('/staff').send({
      name: 'Bob',
      workerType: 'dry-cleaner',
      payType: 'fixed-daily',
      payValue: 100,
      pinCode: '1111'
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.workerType).toBe('dry-cleaner');
    const staffId = createRes.body.data._id;

    // Update
    const updateRes = await request(testApp).patch(`/staff/${staffId}`).send({
      payValue: 150
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.payValue).toBe(150);
  });

  it('Directly invoking StaffService.update as a cashier strips pay fields', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-TEST-4',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });

    const staff = await StaffMember.create({
      shopId: shop._id,
      name: 'Worker',
      workerType: 'ironer',
      payType: 'percentage',
      payValue: 10,
      pinCode: '2222'
    });

    // Directly call the service layer as a cashier trying to give themselves a raise
    const updatedStaff = await staffService.updateStaff(
      shop._id.toString(),
      staff._id.toString(),
      { payValue: 9999 }, // payload
      'cashier' // requestorRole
    );

    // payValue should remain untouched
    expect(updatedStaff.payValue).toBe(10);
  });

  it('User Acceptance: role-gated pay config manipulation', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-TEST-5',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });
    const shopIdStr = shop._id.toString();

    const ownerApp = express();
    ownerApp.use(express.json());
    ownerApp.use('/staff', mockAuth('owner', shopIdStr), staffRoutes);
    ownerApp.use(errorHandler);

    const cashierApp = express();
    cashierApp.use(express.json());
    cashierApp.use('/staff', mockAuth('cashier', shopIdStr), staffRoutes);
    cashierApp.use(errorHandler);

    // 1. As an owner, create a worker with payType=fixed-per-piece, payValue=5
    const createRes = await request(ownerApp).post('/staff').send({
      name: 'Acceptance Worker',
      workerType: 'ironer',
      payType: 'fixed-per-piece',
      payValue: 5,
      pinCode: '5555'
    });
    expect(createRes.status).toBe(201);
    const workerId = createRes.body.data._id;

    // 2. As a cashier token, attempt PATCH on that worker's payValue to 999 and confirm 403
    const patchAsCashier = await request(cashierApp).patch(`/staff/${workerId}`).send({
      payValue: 999
    });
    expect(patchAsCashier.status).toBe(403);

    // 3. As the owner, PATCH it to 7
    const patchAsOwner = await request(ownerApp).patch(`/staff/${workerId}`).send({
      payValue: 7
    });
    expect(patchAsOwner.status).toBe(200);

    // 4. Confirm GET /staff reflects 7 — never 999, never the original 5
    const getRes = await request(ownerApp).get('/staff');
    expect(getRes.status).toBe(200);
    const worker = getRes.body.data.find((s: any) => s._id === workerId);
    expect(worker.payValue).toBe(7);
  });

});
