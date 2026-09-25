import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { Order } from '../order.model.js';
import { OrderService } from '../order.service.js';
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

describe('Order Creation & Route Integration Suite (Phase 3 & 4)', () => {
  const createTestShop = async (capacityLimit: number = 10) => {
    const shop = await Shop.create({
      name: 'Rawnaq Laundry',
      licenseKey: `RWNQ-INT-${Math.random()}`,
      dailyCapacityLimit: capacityLimit,
      expiryDate: new Date(Date.now() + 86400000 * 30),
      priceList: [
        { name: 'Suit', category: 'apparel', pricing: { fullService: 25, ironOnly: 15 } },
        { name: 'Persian Rug', category: 'carpet', pricePerMeter: 30 },
        { name: 'Bed Sheet', category: 'linen', basePrice: 12 },
      ],
    });
    currentShopId = shop._id.toString();
    return shop;
  };

  it('creates a mixed-category order (apparel, carpet, linen) persisting all items with correct category-specific fields, shared orderNumber, and generated sticker itemIds', async () => {
    const shop = await createTestShop();
    const apparelRef = (shop.priceList as any[]).find((i) => i.category === 'apparel')!._id.toString();
    const carpetRef = (shop.priceList as any[]).find((i) => i.category === 'carpet')!._id.toString();
    const linenRef = (shop.priceList as any[]).find((i) => i.category === 'linen')!._id.toString();

    const payload = {
      customerName: 'Ahmad Khan',
      customerPhone: '98765432',
      deliveryDate: new Date(Date.now() + 86400000).toISOString(),
      items: [
        {
          priceListRef: apparelRef,
          name: 'Suit',
          category: 'apparel',
          serviceOption: 'fullService',
        },
        {
          priceListRef: carpetRef,
          name: 'Persian Rug',
          category: 'carpet',
          dimensions: { length: 2.5, width: 2 },
          overrideReason: 'Special 10% discount',
          finalPrice: 135, // 2.5*2 = 5m2 -> 5*30 = 150 original -> 135 final
        },
        {
          priceListRef: linenRef,
          name: 'Bed Sheet',
          category: 'linen',
        },
      ],
    };

    const res = await request(app).post('/api/tenant/orders').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.orderNumber).toBe('0001');
    expect(res.body.data.items).toHaveLength(3);

    const [item1, item2, item3] = res.body.data.items;
    expect(item1.itemId).toBe('0001-01');
    expect(item1.category).toBe('apparel');
    expect(item1.originalPrice).toBe(25);
    expect(item1.finalPrice).toBe(25);

    expect(item2.itemId).toBe('0001-02');
    expect(item2.category).toBe('carpet');
    expect(item2.dimensions.area).toBe(5);
    expect(item2.pricePerMeterSnapshot).toBe(30);
    expect(item2.originalPrice).toBe(150);
    expect(item2.finalPrice).toBe(135);
    expect(item2.overrideReason).toBe('Special 10% discount');

    expect(item3.itemId).toBe('0001-03');
    expect(item3.category).toBe('linen');
    expect(item3.originalPrice).toBe(12);
    expect(item3.finalPrice).toBe(12);
  });

  it('saving a carpet item without dimensions in MongoDB throws a Mongoose ValidationError', async () => {
    const shop = await createTestShop();
    const carpetRef = (shop.priceList as any[]).find((i) => i.category === 'carpet')!._id;

    const promise = Order.create({
      shopId: shop._id,
      customerName: 'Test Customer',
      customerPhone: '11111111',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          priceListRef: carpetRef,
          name: 'Faulty Carpet',
          category: 'carpet',
          originalPrice: 100,
          finalPrice: 100,
          pricePerMeterSnapshot: 20,
          // missing dimensions
        },
      ],
    });

    await expect(promise).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('GET /orders?search= returns exactly the matching order for a known orderNumber and customerPhone', async () => {
    const shop = await createTestShop();
    const linenRef = (shop.priceList as any[]).find((i) => i.category === 'linen')!._id.toString();

    // Create 2 orders
    await request(app).post('/api/tenant/orders').send({
      customerName: 'Alice Smith',
      customerPhone: '55500001',
      deliveryDate: new Date(Date.now() + 86400000).toISOString(),
      items: [{ priceListRef: linenRef, name: 'Sheet 1', category: 'linen' }],
    });

    await request(app).post('/api/tenant/orders').send({
      customerName: 'Bob Jones',
      customerPhone: '55500002',
      deliveryDate: new Date(Date.now() + 86400000).toISOString(),
      items: [{ priceListRef: linenRef, name: 'Sheet 2', category: 'linen' }],
    });

    // Search by phone
    const resPhone = await request(app).get('/api/tenant/orders?search=55500002');
    expect(resPhone.status).toBe(200);
    expect(resPhone.body.data).toHaveLength(1);
    expect(resPhone.body.data[0].customerName).toBe('Bob Jones');
    expect(resPhone.body.data[0].orderNumber).toBe('0002');

    // Search by orderNumber
    const resOrderNum = await request(app).get('/api/tenant/orders?search=0001');
    expect(resOrderNum.status).toBe(200);
    expect(resOrderNum.body.data).toHaveLength(1);
    expect(resOrderNum.body.data[0].customerName).toBe('Alice Smith');
  });

  it('checkCapacity middleware rejects capacity-exceeding requests with HTTP 409 before OrderService.createOrder is ever invoked', async () => {
    const shop = await createTestShop(1); // Capacity limit is 1 item
    const linenRef = (shop.priceList as any[]).find((i) => i.category === 'linen')!._id.toString();
    const targetDate = new Date(Date.now() + 86400000).toISOString();

    const spy = jest.spyOn(OrderService, 'createOrder');

    // 1st request with 1 item -> Succeeds
    const res1 = await request(app).post('/api/tenant/orders').send({
      customerName: 'First Customer',
      customerPhone: '11111111',
      deliveryDate: targetDate,
      items: [{ priceListRef: linenRef, name: 'Sheet 1', category: 'linen' }],
    });
    expect(res1.status).toBe(201);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();

    // 2nd request with 1 item -> Exceeds limit of 1 -> Rejects with 409
    const res2 = await request(app).post('/api/tenant/orders').send({
      customerName: 'Second Customer',
      customerPhone: '22222222',
      deliveryDate: targetDate,
      items: [{ priceListRef: linenRef, name: 'Sheet 2', category: 'linen' }],
    });
    expect(res2.status).toBe(409);
    expect(res2.body.code).toBe('CAPACITY_EXCEEDED');
    expect(spy).not.toHaveBeenCalled();
  });
});
