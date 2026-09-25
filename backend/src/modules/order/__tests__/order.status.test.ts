import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { Order } from '../order.model.js';
import orderRoutes from '../order.routes.js';
import { notificationService } from '../../../services/notification/index.js';
import { errorHandler } from '../../../middleware/errorHandler.js';

let mongoServer: MongoMemoryServer;
let currentShopId: string = '';

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: any) => {
  req.shopId = currentShopId;
  next();
});

app.use('/api/tenant/orders', orderRoutes);
app.use(errorHandler);

jest.setTimeout(30000);

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
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.spyOn(notificationService, 'sendOrderReadyMessage').mockResolvedValue(undefined);
});

const createTestShopAndOrder = async () => {
  const shop = await Shop.create({
    name: 'Rawnaq Status Shop',
    licenseKey: 'RWNQ-STAT-SHOP',
    dailyCapacityLimit: 50,
    expiryDate: new Date(Date.now() + 86400000 * 30),
    priceList: [
      { name: 'Traditional Thobe', category: 'apparel', pricing: { fullService: 30, ironOnly: 15 } },
    ],
  });
  currentShopId = shop._id.toString();

  const apparelRef = (shop.priceList as any[])[0]._id;

  const order = await Order.create({
    shopId: shop._id,
    orderNumber: '0100',
    customerName: 'Khaled Al-Faisal',
    customerPhone: '966501111111',
    deliveryDate: new Date(Date.now() + 86400000),
    status: 'received',
    items: [
      {
        itemId: '0100-01',
        priceListRef: apparelRef,
        name: 'Traditional Thobe',
        category: 'apparel',
        serviceOption: 'fullService',
        originalPrice: 30,
        finalPrice: 30,
      },
    ],
  });

  return { shop, order };
};

describe('Order Status Transitions & Pluggable WhatsApp Notification Verification', () => {
  it('allows valid forward progression: received -> ready -> delivered', async () => {
    const { order } = await createTestShopAndOrder();

    // 1. received -> ready
    const res1 = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'ready' });

    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe('success');
    expect(res1.body.data.status).toBe('ready');

    // 2. ready -> delivered
    const res2 = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'delivered' });

    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('success');
    expect(res2.body.data.status).toBe('delivered');
  });

  it('rejects backward transition: delivered -> received or ready -> received', async () => {
    const { order } = await createTestShopAndOrder();

    // First transition to ready
    await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'ready' });

    // Try backward ready -> received
    const resBackward1 = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'received' });

    expect(resBackward1.status).toBe(400); // or 400 depending on error handler
    expect(resBackward1.body.message || resBackward1.body.error).toMatch(/Invalid status transition from "ready" to "received"/);

    // Transition forward to delivered
    await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'delivered' });

    // Try backward delivered -> received
    const resBackward2 = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'received' });

    expect(resBackward2.status).toBe(400);
    expect(resBackward2.body.message || resBackward2.body.error).toMatch(/Invalid status transition from "delivered" to "received"/);
  });

  it('rejects skipped transition: received -> delivered', async () => {
    const { order } = await createTestShopAndOrder();

    const resSkip = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'delivered' });

    expect(resSkip.status).toBe(400);
    expect(resSkip.body.message || resSkip.body.error).toMatch(/Invalid status transition from "received" to "delivered"/);

    // Verify database status remains 'received'
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder!.status).toBe('received');
  });

  it('triggers notificationService.sendOrderReadyMessage exactly once when status transitions to ready', async () => {
    const { order, shop } = await createTestShopAndOrder();
    const spy = jest.spyOn(notificationService, 'sendOrderReadyMessage').mockResolvedValue(undefined);

    // Transition to ready
    const res1 = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'ready' });

    expect(res1.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('966501111111', '0100', shop.name);

    // Transition to delivered (should NOT call sendOrderReadyMessage again)
    const res2 = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'delivered' });

    expect(res2.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1); // Still 1!
  });

  it('simulated notification failure does NOT fail or rollback the status update', async () => {
    const { order } = await createTestShopAndOrder();

    // Mock sendOrderReadyMessage to reject with a failure
    jest.spyOn(notificationService, 'sendOrderReadyMessage').mockRejectedValue(new Error('Simulated WhatsApp Gateway Crash'));

    const res = await request(app)
      .patch(`/api/tenant/orders/${order._id}/status`)
      .send({ status: 'ready' });

    // HTTP response must still be 200 OK
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ready');

    // Database must have successfully updated to ready
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder!.status).toBe('ready');
  });
});
