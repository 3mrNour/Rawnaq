import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { Order } from '../order.model.js';
import orderRoutes from '../order.routes.js';

let mongoServer: MongoMemoryServer;
let currentShopId: string = '';

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: any) => {
  req.shopId = currentShopId;
  next();
});

app.use('/api/tenant/orders', orderRoutes);

jest.setTimeout(600000);

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

describe('User Acceptance Test: Shop Capacity & Order Creation Verification', () => {
  it('seeds 3-item capacity shop, creates mixed order with carpet price override, confirms calculations & IDs, then verifies capacity rejection before persistence', async () => {
    // 1. Seed shop with 3-item daily capacity and one catalogue entry per category
    const shop = await Shop.create({
      name: 'Rawnaq UAT Shop',
      licenseKey: 'RWNQ-UAT-SHOP',
      dailyCapacityLimit: 3,
      expiryDate: new Date(Date.now() + 86400000 * 30),
      priceList: [
        { name: 'Traditional Thobe', category: 'apparel', pricing: { fullService: 30, ironOnly: 15 } },
        { name: 'Persian Silk Carpet', category: 'carpet', pricePerMeter: 25 },
        { name: 'Hotel Queen Sheet', category: 'linen', basePrice: 10 },
      ],
    });
    currentShopId = shop._id.toString();

    const apparelRef = (shop.priceList as any[]).find((i) => i.category === 'apparel')!._id.toString();
    const carpetRef = (shop.priceList as any[]).find((i) => i.category === 'carpet')!._id.toString();
    const linenRef = (shop.priceList as any[]).find((i) => i.category === 'linen')!._id.toString();

    const targetDeliveryDate = '2026-08-01T14:00:00.000Z';

    // 2. Submit order with 1 apparel (full-service), 1 carpet (2m x 3m, price overridden with reason), and 1 linen
    const order1Payload = {
      customerName: 'Ahmad Al-Mansoor',
      customerPhone: '966500000001',
      deliveryDate: targetDeliveryDate,
      items: [
        {
          priceListRef: apparelRef,
          name: 'Traditional Thobe',
          category: 'apparel',
          serviceOption: 'fullService',
        },
        {
          priceListRef: carpetRef,
          name: 'Persian Silk Carpet',
          category: 'carpet',
          dimensions: { length: 2, width: 3 },
          finalPrice: 130, // 2m x 3m = 6m2 -> 6 * 25 = 150 original -> overridden to 130
          overrideReason: 'VIP Customer 20 SAR promotional discount',
        },
        {
          priceListRef: linenRef,
          name: 'Hotel Queen Sheet',
          category: 'linen',
        },
      ],
    };

    console.log('\n--- Submitting Order 1 (3 items) ---');
    const res1 = await request(app).post('/api/tenant/orders').send(order1Payload);
    console.log('Order 1 Response Status:', res1.status);
    console.log('Order 1 Response JSON:\n', JSON.stringify(res1.body, null, 2));

    // 3. Confirm response assertions
    expect(res1.status).toBe(201);
    expect(res1.body.status).toBe('success');
    const orderData = res1.body.data;
    
    // Shared orderNumber
    expect(orderData.orderNumber).toBe('0001');
    expect(orderData.items).toHaveLength(3);

    // Item 1: Apparel
    expect(orderData.items[0].itemId).toBe('0001-01');
    expect(orderData.items[0].category).toBe('apparel');
    expect(orderData.items[0].originalPrice).toBe(30);
    expect(orderData.items[0].finalPrice).toBe(30);

    // Item 2: Carpet (2m x 3m = 6m2, original 150, final 130, with overrideReason)
    expect(orderData.items[1].itemId).toBe('0001-02');
    expect(orderData.items[1].category).toBe('carpet');
    expect(orderData.items[1].dimensions).toEqual({ length: 2, width: 3, area: 6 });
    expect(orderData.items[1].pricePerMeterSnapshot).toBe(25);
    expect(orderData.items[1].originalPrice).toBe(150);
    expect(orderData.items[1].finalPrice).toBe(130);
    expect(orderData.items[1].overrideReason).toBe('VIP Customer 20 SAR promotional discount');

    // Item 3: Linen
    expect(orderData.items[2].itemId).toBe('0001-03');
    expect(orderData.items[2].category).toBe('linen');
    expect(orderData.items[2].originalPrice).toBe(10);
    expect(orderData.items[2].finalPrice).toBe(10);

    // Verify 1 order exists in DB
    expect(await Order.countDocuments({})).toBe(1);

    // 4. Submit second order that would exceed capacity (3 items already scheduled, limit is 3)
    const order2Payload = {
      customerName: 'Fatima Al-Zahra',
      customerPhone: '966500000002',
      deliveryDate: '2026-08-01T18:00:00.000Z',
      items: [
        {
          priceListRef: apparelRef,
          name: 'Traditional Thobe',
          category: 'apparel',
          serviceOption: 'fullService',
        },
      ],
    };

    console.log('\n--- Submitting Order 2 (1 item on same day, should exceed 3-item limit) ---');
    const res2 = await request(app).post('/api/tenant/orders').send(order2Payload);
    console.log('Order 2 Response Status:', res2.status);
    console.log('Order 2 Response JSON:\n', JSON.stringify(res2.body, null, 2));

    // 5. Confirm second order is rejected with CAPACITY_EXCEEDED before anything is persisted
    expect(res2.status).toBe(409);
    expect(res2.body.status).toBe('error');
    expect(res2.body.code).toBe('CAPACITY_EXCEEDED');
    expect(res2.body.date).toBe('2026-08-01T18:00:00.000Z');

    // Confirm nothing new was persisted in DB
    expect(await Order.countDocuments({})).toBe(1);
    console.log('\n--- Verification Complete: DB still contains exactly 1 order ---');
  });
});
