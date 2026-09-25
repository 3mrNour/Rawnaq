import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { Order } from '../order.model.js';
import { checkCapacity } from '../../../middleware/checkCapacity.middleware.js';
import { countScheduledItems } from '../order.service.js';

let mongoServer: MongoMemoryServer;

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req: Request, res: Response, next: any) => {
  req.shopId = 'MOCK_SHOP_ID'; // Will be overridden in specific tests
  next();
});

app.post('/api/tenant/orders', checkCapacity, (req, res) => {
  res.status(201).json({ status: 'success', message: 'Order simulated' });
});

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
  await Order.deleteMany({});
});

const createMockLinenItem = (name: string) => ({
  priceListRef: new mongoose.Types.ObjectId(),
  name,
  category: 'linen' as const,
  originalPrice: 10,
  finalPrice: 10,
});

describe('Capacity Check & Order Query Integration Suite', () => {

  it('countScheduledItems purely aggregates items matching the specific calendar day', async () => {
    const shopIdStr = new mongoose.Types.ObjectId().toString();
    const dateStr = '2026-08-15T12:00:00Z'; // The target date

    // Day before
    await Order.create({
      shopId: shopIdStr,
      customerName: 'Customer A',
      customerPhone: '11111111',
      deliveryDate: new Date('2026-08-14T23:59:00Z'),
      items: [createMockLinenItem('Item 1'), createMockLinenItem('Item 2')] // 2 items
    });

    // Exact target date (early morning)
    await Order.create({
      shopId: shopIdStr,
      customerName: 'Customer B',
      customerPhone: '22222222',
      deliveryDate: new Date('2026-08-15T00:01:00Z'),
      items: [createMockLinenItem('Item 3'), createMockLinenItem('Item 4'), createMockLinenItem('Item 5')] // 3 items
    });

    // Exact target date (late night)
    await Order.create({
      shopId: shopIdStr,
      customerName: 'Customer C',
      customerPhone: '33333333',
      deliveryDate: new Date('2026-08-15T23:58:00Z'),
      items: [createMockLinenItem('Item 6')] // 1 item
    });

    // Day after
    await Order.create({
      shopId: shopIdStr,
      customerName: 'Customer D',
      customerPhone: '44444444',
      deliveryDate: new Date('2026-08-16T00:01:00Z'),
      items: [createMockLinenItem('Item 7'), createMockLinenItem('Item 8'), createMockLinenItem('Item 9')] // 3 items
    });

    const total = await countScheduledItems(shopIdStr, dateStr);

    // It should ONLY count the items on 2026-08-15 (3 + 1 = 4 items)
    expect(total).toBe(4);
  });

  it('checkCapacity middleware succeeds when under limit and rejects exactly on breach', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-CAP-TEST',
      dailyCapacityLimit: 2,
      expiryDate: new Date(),
    });
    const shopIdStr = shop._id.toString();

    // Create a specific app for this test to inject the correct shopId
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req: Request, res: Response, next: any) => {
      req.shopId = shopIdStr;
      next();
    });
    testApp.post('/api/tenant/orders', checkCapacity, async (req, res) => {
      // Simulate successful order creation by actually saving the order to DB 
      // so the next request accurately reflects the new count
      await Order.create({
        shopId: shopIdStr,
        customerName: req.body.customerName || 'Test Customer',
        customerPhone: req.body.customerPhone || '99999999',
        deliveryDate: req.body.deliveryDate,
        items: req.body.items
      });
      res.status(201).json({ status: 'success' });
    });

    const targetDate = '2026-12-01T10:00:00Z';

    // 1st request: 1 item (total: 1, limit: 2) -> Succeeds
    const res1 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'Alice',
      customerPhone: '5551234',
      deliveryDate: targetDate,
      items: [createMockLinenItem('A')]
    });
    expect(res1.status).toBe(201);

    // 2nd request: 1 item (total: 2, limit: 2) -> Succeeds
    const res2 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'Bob',
      customerPhone: '5555678',
      deliveryDate: targetDate,
      items: [createMockLinenItem('B')]
    });
    expect(res2.status).toBe(201);

    // 3rd request: 1 item (total: 3, limit: 2) -> Fails
    const res3 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'Charlie',
      customerPhone: '5559012',
      deliveryDate: targetDate,
      items: [createMockLinenItem('C')]
    });
    expect(res3.status).toBe(409);
    expect(res3.body.code).toBe('CAPACITY_EXCEEDED');
    expect(res3.body.date).toBe(targetDate);
  });

  it('User Acceptance: per-date capacity checking logic', async () => {
    // Set a shop's dailyCapacityLimit=2
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-CAP-TEST-UAT',
      dailyCapacityLimit: 2,
      expiryDate: new Date(),
    });
    const shopIdStr = shop._id.toString();

    const testApp = express();
    testApp.use(express.json());
    testApp.use((req: Request, res: Response, next: any) => {
      req.shopId = shopIdStr;
      next();
    });
    testApp.post('/api/tenant/orders', checkCapacity, async (req, res) => {
      await Order.create({
        shopId: shopIdStr,
        customerName: req.body.customerName || 'Test Customer',
        customerPhone: req.body.customerPhone || '88888888',
        deliveryDate: req.body.deliveryDate,
        items: req.body.items
      });
      res.status(201).json({ status: 'success' });
    });

    const targetDate1 = '2026-08-01T10:00:00Z';
    const targetDate2 = '2026-08-02T10:00:00Z';

    // Submit two 1-item orders for 2026-08-01 (both should succeed)
    const res1 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'User 1',
      customerPhone: '7770001',
      deliveryDate: targetDate1,
      items: [createMockLinenItem('Item 1')]
    });
    expect(res1.status).toBe(201);

    const res2 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'User 2',
      customerPhone: '7770002',
      deliveryDate: targetDate1,
      items: [createMockLinenItem('Item 2')]
    });
    expect(res2.status).toBe(201);

    // Submit a third 1-item order for the same date and confirm 409 CAPACITY_EXCEEDED
    const res3 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'User 3',
      customerPhone: '7770003',
      deliveryDate: targetDate1,
      items: [createMockLinenItem('Item 3')]
    });
    expect(res3.status).toBe(409);
    expect(res3.body.code).toBe('CAPACITY_EXCEEDED');

    // Submit a 1-item order for 2026-08-02 and confirm it succeeds
    const res4 = await request(testApp).post('/api/tenant/orders').send({
      customerName: 'User 4',
      customerPhone: '7770004',
      deliveryDate: targetDate2,
      items: [createMockLinenItem('Item 4')]
    });
    expect(res4.status).toBe(201);
  });

});
