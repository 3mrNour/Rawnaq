import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { Shop } from '../../shop/shop.model.js';
import { StaffMember } from '../../staff/staff.model.js';
import { Order } from '../../order/order.model.js';
import tenantRoutes from '../../tenant/tenant.routes.js';
import { errorHandler } from '../../../middleware/errorHandler.js';
import { AssignmentService } from '../../../services/assignment.service.js';
import { EarningsService } from '../../../services/earnings.service.js';

let mongoServer: MongoMemoryServer;

const app = express();
app.use(express.json());
process.env.JWT_SECRET = 'test_secret_key';

app.use('/api/tenant', tenantRoutes);
app.use(errorHandler);

jest.setTimeout(600000); // 10 minutes

let mockShopId: string;
let ownerToken: string;
let cashierToken: string;

const generateToken = (shopId: string, role: string, sub: string) => {
  return jwt.sign({ sub, shopId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Shop.deleteMany({});
  await StaffMember.deleteMany({});
  await Order.deleteMany({});

  const shop = await Shop.create({
    name: 'Rawnaq Test Shop',
    licenseKey: 'RWNQ-TEST-ASSIGN',
    dailyCapacityLimit: 100,
    subscriptionStatus: 'active',
    expiryDate: new Date(Date.now() + 86400000 * 30),
    priceList: [],
  });

  mockShopId = shop._id.toString();

  const owner = await StaffMember.create({
    shopId: shop._id,
    name: 'Shop Owner',
    email: 'owner@test.com',
    passwordHash: 'hashed_pwd',
    role: 'owner',
    workerType: 'none',
  });

  const cashier = await StaffMember.create({
    shopId: shop._id,
    name: 'Shop Cashier',
    email: 'cashier@test.com',
    passwordHash: 'hashed_pwd',
    role: 'cashier',
    workerType: 'none',
  });

  ownerToken = generateToken(mockShopId, 'owner', owner._id.toString());
  cashierToken = generateToken(mockShopId, 'cashier', cashier._id.toString());
});

describe('Item-Level Worker Assignment & Earnings Reporting Suite', () => {
  it('Task 1.1: Assigning item to percentage worker (10%) on $20 item sets workerRateSnapshot=$2; duplicate assign rejected with assignee name', async () => {
    const worker = await StaffMember.create({
      shopId: mockShopId,
      name: 'John Drycleaner',
      workerType: 'dry-cleaner',
      payType: 'percentage',
      payValue: 10, // 10%
      pinCode: '1111',
    });

    const order = await Order.create({
      shopId: mockShopId,
      orderNumber: 'ORD-001',
      customerName: 'Customer',
      customerPhone: '12345678',
      status: 'received',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          itemId: 'ITEM-1',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Shirt',
          category: 'apparel',
          originalPrice: 20,
          finalPrice: 20, // $20
          serviceOption: 'fullService',
        },
      ],
    });

    const result = await AssignmentService.assignItemToWorker({
      shopId: mockShopId,
      itemId: 'ITEM-1',
      pinCode: '1111',
    });

    expect(result.item.workerRateSnapshot).toBe(2); // 10% of $20 = $2
    expect(result.item.assignedWorkerId?.toString()).toBe(worker._id.toString());
    expect(result.autoTransitionedToReady).toBe(true); // only 1 item, so flips to ready

    // Attempt re-assigning to another worker
    const worker2 = await StaffMember.create({
      shopId: mockShopId,
      name: 'Jane Ironer',
      workerType: 'ironer',
      payType: 'percentage',
      payValue: 15,
      pinCode: '2222',
    });

    await expect(
      AssignmentService.assignItemToWorker({
        shopId: mockShopId,
        itemId: 'ITEM-1',
        pinCode: '2222',
      })
    ).rejects.toThrow('Item is already assigned to John Drycleaner');
  });

  it('Task 1.2: Fixed-daily pay handling sets workerRateSnapshot=0 at item level', async () => {
    await StaffMember.create({
      shopId: mockShopId,
      name: 'Daily Worker',
      workerType: 'ironer',
      payType: 'fixed-daily',
      payValue: 50, // $50 daily
      pinCode: '3333',
    });

    await Order.create({
      shopId: mockShopId,
      orderNumber: 'ORD-002',
      customerName: 'Customer 2',
      customerPhone: '12345678',
      status: 'received',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          itemId: 'ITEM-2',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Pants',
          category: 'apparel',
          originalPrice: 30,
          finalPrice: 30,
          serviceOption: 'ironOnly',
        },
      ],
    });

    const result = await AssignmentService.assignItemToWorker({
      shopId: mockShopId,
      itemId: 'ITEM-2',
      pinCode: '3333',
    });

    expect(result.item.workerRateSnapshot).toBe(0);
    expect(result.item.assignedWorkerId).toBeDefined();
  });

  it('Task 1.3: POST /api/tenant/assignments rejects wrong PIN and non-production staff PIN', async () => {
    // Non-production staff
    await StaffMember.create({
      shopId: mockShopId,
      name: 'Office Staff',
      workerType: 'none',
      pinCode: '4444',
    });

    await Order.create({
      shopId: mockShopId,
      orderNumber: 'ORD-003',
      customerName: 'Customer 3',
      customerPhone: '12345678',
      status: 'received',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          itemId: 'ITEM-3',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Jacket',
          category: 'apparel',
          originalPrice: 50,
          finalPrice: 50,
          serviceOption: 'fullService',
        },
      ],
    });

    // Wrong PIN
    const res1 = await request(app)
      .post('/api/tenant/assignments')
      .set('Authorization', `Bearer ${cashierToken}`) // device auth
      .send({ itemId: 'ITEM-3', pinCode: '9999' });

    expect(res1.status).toBe(400);
    expect(res1.body.message).toBe('PIN not recognized');

    // Correct PIN for workerType='none'
    const res2 = await request(app)
      .post('/api/tenant/assignments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ itemId: 'ITEM-3', pinCode: '4444' });

    expect(res2.status).toBe(400);
    expect(res2.body.message).toBe('PIN not recognized');
  });

  it('Task 2.1: Auto-transition order to ready only when fully assigned', async () => {
    await StaffMember.create({
      shopId: mockShopId,
      name: 'Worker A',
      workerType: 'dry-cleaner',
      payType: 'fixed-per-piece',
      payValue: 5,
      pinCode: '5555',
    });

    await Order.create({
      shopId: mockShopId,
      orderNumber: 'ORD-004',
      customerName: 'Customer 4',
      customerPhone: '12345678',
      status: 'received',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          itemId: 'ITEM-4A',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Item A',
          category: 'apparel',
          originalPrice: 10,
          finalPrice: 10,
          serviceOption: 'fullService',
        },
        {
          itemId: 'ITEM-4B',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Item B',
          category: 'apparel',
          originalPrice: 10,
          finalPrice: 10,
          serviceOption: 'fullService',
        },
      ],
    });

    // Assign first item
    const resA = await AssignmentService.assignItemToWorker({
      shopId: mockShopId,
      itemId: 'ITEM-4A',
      pinCode: '5555',
    });
    expect(resA.autoTransitionedToReady).toBe(false);
    const orderAfterA = await Order.findOne({ shopId: mockShopId, orderNumber: 'ORD-004' });
    expect(orderAfterA?.status).toBe('received');

    // Assign second item
    const resB = await AssignmentService.assignItemToWorker({
      shopId: mockShopId,
      itemId: 'ITEM-4B',
      pinCode: '5555',
    });
    expect(resB.autoTransitionedToReady).toBe(true);
    const orderAfterB = await Order.findOne({ shopId: mockShopId, orderNumber: 'ORD-004' });
    expect(orderAfterB?.status).toBe('ready');
  });

  it('Task 2.2: Worker earnings aggregation calculates correct total for percentage, fixed-per-piece, and fixed-daily', async () => {
    const wPercentage = await StaffMember.create({
      shopId: mockShopId,
      name: 'Perc Worker',
      workerType: 'dry-cleaner',
      payType: 'percentage',
      payValue: 20, // 20%
      pinCode: '6001',
    });

    const wPiece = await StaffMember.create({
      shopId: mockShopId,
      name: 'Piece Worker',
      workerType: 'ironer',
      payType: 'fixed-per-piece',
      payValue: 3, // $3 per piece
      pinCode: '6002',
    });

    const wDaily = await StaffMember.create({
      shopId: mockShopId,
      name: 'Daily Worker',
      workerType: 'dry-cleaner',
      payType: 'fixed-daily',
      payValue: 40, // $40 per day
      pinCode: '6003',
    });

    const order = await Order.create({
      shopId: mockShopId,
      orderNumber: 'ORD-005',
      customerName: 'Customer 5',
      customerPhone: '12345678',
      status: 'received',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          itemId: 'ITEM-5A',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Suit 1',
          category: 'apparel',
          originalPrice: 100,
          finalPrice: 100,
          serviceOption: 'fullService',
        },
        {
          itemId: 'ITEM-5B',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Suit 2',
          category: 'apparel',
          originalPrice: 50,
          finalPrice: 50,
          serviceOption: 'fullService',
        },
        {
          itemId: 'ITEM-5C',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Shirt 1',
          category: 'apparel',
          originalPrice: 15,
          finalPrice: 15,
          serviceOption: 'ironOnly',
        },
        {
          itemId: 'ITEM-5D',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Shirt 2',
          category: 'apparel',
          originalPrice: 15,
          finalPrice: 15,
          serviceOption: 'ironOnly',
        },
        {
          itemId: 'ITEM-5E',
          priceListRef: new mongoose.Types.ObjectId(),
          name: 'Dress',
          category: 'apparel',
          originalPrice: 80,
          finalPrice: 80,
          serviceOption: 'fullService',
        },
      ],
    });

    // Assign ITEM-5A ($100) and ITEM-5B ($50) to percentage worker -> 20% of 150 = $30
    await AssignmentService.assignItemToWorker({ shopId: mockShopId, itemId: 'ITEM-5A', pinCode: '6001' });
    await AssignmentService.assignItemToWorker({ shopId: mockShopId, itemId: 'ITEM-5B', pinCode: '6001' });

    // Assign ITEM-5C and ITEM-5D to piece worker -> 2 pieces * $3 = $6
    await AssignmentService.assignItemToWorker({ shopId: mockShopId, itemId: 'ITEM-5C', pinCode: '6002' });
    await AssignmentService.assignItemToWorker({ shopId: mockShopId, itemId: 'ITEM-5D', pinCode: '6002' });

    // Assign ITEM-5E to daily worker -> worked on 1 day = $40
    await AssignmentService.assignItemToWorker({ shopId: mockShopId, itemId: 'ITEM-5E', pinCode: '6003' });

    const earnPerc = await EarningsService.getWorkerEarnings(mockShopId, wPercentage._id.toString());
    expect(earnPerc.totalEarnings).toBe(30);

    const earnPiece = await EarningsService.getWorkerEarnings(mockShopId, wPiece._id.toString());
    expect(earnPiece.totalEarnings).toBe(6);

    const earnDaily = await EarningsService.getWorkerEarnings(mockShopId, wDaily._id.toString());
    expect(earnDaily.totalEarnings).toBe(40);
    expect(earnDaily.uniqueDaysWorked).toBe(1);
  });

  it('Task 2.3: GET /api/tenant/staff/:id/earnings returns 403 for cashier and 200 for owner', async () => {
    const worker = await StaffMember.create({
      shopId: mockShopId,
      name: 'Test Worker',
      workerType: 'dry-cleaner',
      payType: 'fixed-per-piece',
      payValue: 10,
      pinCode: '7001',
    });

    // Cashier request
    const resCashier = await request(app)
      .get(`/api/tenant/staff/${worker._id}/earnings`)
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(resCashier.status).toBe(403);

    // Owner request
    const resOwner = await request(app)
      .get(`/api/tenant/staff/${worker._id}/earnings`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(resOwner.status).toBe(200);
    expect(resOwner.body.status).toBe('success');
    expect(resOwner.body.data.workerId).toBe(worker._id.toString());
  });
});
