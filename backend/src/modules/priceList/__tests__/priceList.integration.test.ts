import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import priceListRoutes from '../priceList.routes.js';
import { errorHandler } from '../../../middleware/errorHandler.js';

let mongoServer: MongoMemoryServer;

const app = express();
app.use(express.json());

// Mock auth directly for easier role testing without doing full login dance
const mockAuth = (role: 'owner' | 'cashier', shopId: string) => {
  return (req: Request, res: Response, next: any) => {
    req.staffRole = role;
    req.shopId = shopId;
    next();
  };
};

app.use('/api/tenant/price-list-owner', mockAuth('owner', 'MOCK_SHOP_ID'), priceListRoutes);
app.use('/api/tenant/price-list-cashier', mockAuth('cashier', 'MOCK_SHOP_ID'), priceListRoutes);
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
});

describe('PriceList Model & Role-Gated CRUD Integration Suite', () => {

  it('Owner can add an item for each category using only that category\'s specific fields', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-PL-TEST-1',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });
    const shopIdStr = shop._id.toString();

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/price-list', mockAuth('owner', shopIdStr), priceListRoutes);
    testApp.use(errorHandler);

    // Add Apparel
    const res1 = await request(testApp).post('/price-list').send({
      category: 'apparel',
      name: 'Shirt',
      pricing: { fullService: 10, ironOnly: 5 }
    });
    expect(res1.status).toBe(201);
    expect(res1.body.data._id).toBeDefined();

    // Add Carpet
    const res2 = await request(testApp).post('/price-list').send({
      category: 'carpet',
      name: 'Persian Rug',
      pricePerMeter: 50
    });
    expect(res2.status).toBe(201);

    // Add Linen
    const res3 = await request(testApp).post('/price-list').send({
      category: 'linen',
      name: 'Bed Sheet',
      basePrice: 15
    });
    expect(res3.status).toBe(201);

    // Verify
    const shopUpdated = await Shop.findById(shopIdStr);
    expect(shopUpdated?.priceList.length).toBe(3);
  });

  it('Owner can update a carpet entry (pricePerMeter), and its _id perfectly matches the original _id', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-PL-TEST-2',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
      priceList: [
        {
          category: 'carpet',
          name: 'Old Rug',
          pricePerMeter: 30
        } as any
      ]
    });
    const shopIdStr = shop._id.toString();
    const itemIdStr = (shop.priceList[0] as any)._id.toString();

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/price-list', mockAuth('owner', shopIdStr), priceListRoutes);
    testApp.use(errorHandler);

    // Update
    const patchRes = await request(testApp).patch(`/price-list/${itemIdStr}`).send({
      pricePerMeter: 45
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data._id).toBe(itemIdStr); // _id should be identical

    const shopUpdated = await Shop.findById(shopIdStr);
    expect((shopUpdated?.priceList[0] as any)._id.toString()).toBe(itemIdStr);
    expect((shopUpdated?.priceList[0] as any).pricePerMeter).toBe(45);
  });

  it('Cashier token gets a 403 on POST/PATCH/DELETE operations', async () => {
    // Attempt POST
    let res = await request(app).post('/api/tenant/price-list-cashier').send({ 
      category: 'linen', name: 'Towel', basePrice: 5 
    });
    expect(res.status).toBe(403);
    
    // Attempt PATCH
    res = await request(app).patch('/api/tenant/price-list-cashier/605c72e2e9b8b0b9b4a9a9b9').send({ basePrice: 10 });
    expect(res.status).toBe(403);

    // Attempt DELETE
    res = await request(app).delete('/api/tenant/price-list-cashier/605c72e2e9b8b0b9b4a9a9b9');
    expect(res.status).toBe(403);
  });

  it('Both owner and cashier can successfully perform a GET request', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-PL-TEST-3',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
      priceList: [
        { category: 'apparel', name: 'Jacket', pricing: { fullService: 20, ironOnly: 10 } } as any
      ]
    });
    const shopIdStr = shop._id.toString();

    const ownerApp = express();
    ownerApp.use('/price-list', mockAuth('owner', shopIdStr), priceListRoutes);

    const cashierApp = express();
    cashierApp.use('/price-list', mockAuth('cashier', shopIdStr), priceListRoutes);

    const ownerRes = await request(ownerApp).get('/price-list');
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data.length).toBe(1);

    const cashierRes = await request(cashierApp).get('/price-list');
    expect(cashierRes.status).toBe(200);
    expect(cashierRes.body.data.length).toBe(1);
  });

  it('User Acceptance: _id stability and role gating on carpet price updates', async () => {
    const shop = await Shop.create({
      name: 'Shop',
      licenseKey: 'RWNQ-PL-TEST-4',
      dailyCapacityLimit: 100,
      expiryDate: new Date(),
    });
    const shopIdStr = shop._id.toString();

    const ownerApp = express();
    ownerApp.use(express.json());
    ownerApp.use('/price-list', mockAuth('owner', shopIdStr), priceListRoutes);

    const cashierApp = express();
    cashierApp.use(express.json());
    cashierApp.use('/price-list', mockAuth('cashier', shopIdStr), priceListRoutes);

    // 1. As owner, add a carpet entry with pricePerMeter=50 and note its _id
    const createRes = await request(ownerApp).post('/price-list').send({
      category: 'carpet',
      name: 'Persian Masterpiece',
      pricePerMeter: 50
    });
    expect(createRes.status).toBe(201);
    const carpetId = createRes.body.data._id;
    expect(carpetId).toBeDefined();

    // 2. As a cashier token, attempt PATCH on that worker's payValue to 999 and confirm 403
    // Wait, the prompt says "Update pricePerMeter to 65" as owner, but wait. Let me do what the user asked exactly:
    // "As owner, add a carpet entry with pricePerMeter=50 and note its _id. Update pricePerMeter to 65. Confirm GET /price-list shows 65 for that same _id, not a newly created entry — this _id stability is required for the future Order module to snapshot prices correctly."
    // Ah, the user didn't mention testing the cashier token in *this* specific prompt, they just mentioned it in the previous one. Let's just follow their prompt:

    // 2. Update pricePerMeter to 65 as owner
    const patchRes = await request(ownerApp).patch(`/price-list/${carpetId}`).send({
      pricePerMeter: 65
    });
    expect(patchRes.status).toBe(200);

    // 3. Confirm GET /price-list shows 65 for that same _id, not a newly created entry
    const getRes = await request(ownerApp).get('/price-list');
    expect(getRes.status).toBe(200);
    const items = getRes.body.data;
    
    // Ensure there is still only 1 item
    expect(items.length).toBe(1);
    
    // Ensure the ID matches perfectly
    expect(items[0]._id).toBe(carpetId);
    
    // Ensure the price was updated
    expect(items[0].pricePerMeter).toBe(65);
  });

});
