import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import * as shopService from '../shop.service.js';
import { Shop } from '../shop.model.js';
import { checkSubscription } from '../../../middleware/checkSubscription.middleware.js';
import { jest } from '@jest/globals';

let mongoServer: MongoMemoryServer;

// Setup a mock express app to test the middleware against our database
const app = express();
app.use(express.json());

jest.setTimeout(600000); // 10 minutes

const mockTenantAuth = (req: Request, res: Response, next: NextFunction) => {
  const shopId = req.headers['x-shop-id'] as unknown as string;
  if (shopId) {
    req.shopId = shopId;
  }
  next();
};

app.get('/test-protected', mockTenantAuth, checkSubscription, (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

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
});

describe('Shop/Tenant Module Integration Suite', () => {
  
  it('shop creation returns a unique RWNQ-formatted key', async () => {
    const shop1 = await shopService.createShop(
      'Test Shop 1',
      100,
      new Date(Date.now() + 86400000) // tomorrow
    );

    const shop2 = await shopService.createShop(
      'Test Shop 2',
      100,
      new Date(Date.now() + 86400000) // tomorrow
    );

    const licenseKeyRegex = /^RWNQ-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    expect(shop1.licenseKey).toMatch(licenseKeyRegex);
    expect(shop2.licenseKey).toMatch(licenseKeyRegex);
    expect(shop1.licenseKey).not.toEqual(shop2.licenseKey);
  });

  it('subscription transitions active→suspended→active correctly block/unblock checkSubscription', async () => {
    const shop = await shopService.createShop(
      'Test Shop Status Transition',
      100,
      new Date(Date.now() + 86400000) // tomorrow
    );
    
    const shopId = shop._id as unknown as string;

    // 1. ACTIVE - Should Pass
    let response = await request(app)
      .get('/test-protected')
      .set('x-shop-id', shopId);
    expect(response.status).toBe(200);

    // 2. SUSPENDED - Should Block
    await shopService.updateStatus(shopId, 'suspended');
    response = await request(app)
      .get('/test-protected')
      .set('x-shop-id', shopId);
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('SUBSCRIPTION_INACTIVE');

    // 3. EXPIRED (time check bypasses status) - Should Block
    await shopService.updateStatus(shopId, 'active'); // back to active
    
    // Manually mutate expiry to the past to bypass extendExpiry restriction
    const shopDoc = await Shop.findById(shopId);
    shopDoc!.expiryDate = new Date(Date.now() - 1000);
    await shopDoc!.save();
    
    response = await request(app)
      .get('/test-protected')
      .set('x-shop-id', shopId);
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('expired');

    // 4. ACTIVE AGAIN - Should Pass
    await shopService.extendExpiry(shopId, new Date(Date.now() + 86400000));
    response = await request(app)
      .get('/test-protected')
      .set('x-shop-id', shopId);
    expect(response.status).toBe(200);
  });

  it('revoking a key issues a new one and the old key no longer identifies a valid shop', async () => {
    const shop = await shopService.createShop(
      'Test Shop Revoke',
      100,
      new Date(Date.now() + 86400000)
    );
    
    const originalKey = shop.licenseKey;

    const revokedShop = await shopService.revokeKey(shop._id as unknown as string);
    const newKey = revokedShop.licenseKey;

    expect(originalKey).not.toEqual(newKey);

    // Verify the old key is gone from the database
    const oldKeyExists = await Shop.exists({ licenseKey: originalKey });
    const newKeyExists = await Shop.exists({ licenseKey: newKey });

    expect(oldKeyExists).toBeNull();
    expect(newKeyExists).not.toBeNull();
  });

  it('unlocking a device clears deviceFingerprint so a new fingerprint can bind', async () => {
    // 1. Create a shop and manually bind a fingerprint (simulating a device login)
    const shop = await shopService.createShop(
      'Test Shop Device Unlock',
      100,
      new Date(Date.now() + 86400000)
    );
    
    shop.deviceFingerprint = 'OLD-FINGERPRINT-123';
    await shop.save();

    let fetchedShop = await Shop.findById(shop._id);
    expect(fetchedShop?.deviceFingerprint).toBe('OLD-FINGERPRINT-123');

    // 2. Unlock the device
    await shopService.unlockDevice(shop._id as unknown as string);

    // 3. Verify it is cleared
    fetchedShop = await Shop.findById(shop._id);
    expect(fetchedShop?.deviceFingerprint).toBeNull();
  });

  it('Metrics endpoint returns accurate counts using $facet aggregation', async () => {
    // Clear existing
    await Shop.deleteMany({});
    const now = new Date();
    
    // Seed exactly 5 shops:
    // 1. active, expires in 30 days
    // 2. active, expires in 20 days
    // 3. active, expires in 3 days (expiringSoon)
    // 4. suspended
    // 5. expired
    
    await Shop.create([
      { name: 'Active Normal 1', licenseKey: 'RWNQ-1111-1111', subscriptionStatus: 'active', dailyCapacityLimit: 100, expiryDate: new Date(now.getTime() + 30 * 86400000) },
      { name: 'Active Normal 2', licenseKey: 'RWNQ-2222-2222', subscriptionStatus: 'active', dailyCapacityLimit: 100, expiryDate: new Date(now.getTime() + 20 * 86400000) },
      { name: 'Active Expiring', licenseKey: 'RWNQ-3333-3333', subscriptionStatus: 'active', dailyCapacityLimit: 100, expiryDate: new Date(now.getTime() + 3 * 86400000) },
      { name: 'Suspended Shop', licenseKey: 'RWNQ-4444-4444', subscriptionStatus: 'suspended', dailyCapacityLimit: 100, expiryDate: new Date(now.getTime() + 100 * 86400000) },
      { name: 'Expired Shop', licenseKey: 'RWNQ-5555-5555', subscriptionStatus: 'expired', dailyCapacityLimit: 100, expiryDate: new Date(now.getTime() - 5 * 86400000) },
    ]);

    const metrics = await shopService.getMetrics();
    
    expect(metrics).toEqual({
      active: 3,
      suspended: 1,
      expired: 1,
      expiringSoon: 1
    });
  });

});
