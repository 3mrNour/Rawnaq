import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { generateOrderNumber, generateItemId } from '../orderNumber.service.js';
import { Counter } from '../counter.model.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Counter.deleteMany({});
});

describe('Order Number & Item ID Generation Suite (Task 1.2 & 1.3)', () => {
  it('generateOrderNumber produces 20 distinct sequential order numbers with zero collisions under 20 concurrent requests', async () => {
    const shopId = new mongoose.Types.ObjectId().toString();

    // Fire 20 concurrent requests
    const promises = Array.from({ length: 20 }, () => generateOrderNumber(shopId));
    const results = await Promise.all(promises);

    // Verify 20 distinct results
    const uniqueNumbers = new Set(results);
    expect(uniqueNumbers.size).toBe(20);

    // Verify they are padded and range from 0001 to 0020
    const sorted = [...results].sort();
    expect(sorted[0]).toBe('0001');
    expect(sorted[19]).toBe('0020');
  });

  it('generateOrderNumber maintains separate sequences for different shops', async () => {
    const shopA = new mongoose.Types.ObjectId().toString();
    const shopB = new mongoose.Types.ObjectId().toString();

    const numA1 = await generateOrderNumber(shopA);
    const numB1 = await generateOrderNumber(shopB);
    const numA2 = await generateOrderNumber(shopA);

    expect(numA1).toBe('0001');
    expect(numB1).toBe('0001');
    expect(numA2).toBe('0002');
  });

  it('generateItemId produces 5 sequential, uniquely suffixed itemIds for an order with 5 items', () => {
    const orderNumber = '0001';
    const itemIds = Array.from({ length: 5 }, (_, i) => generateItemId(orderNumber, i));

    expect(itemIds).toEqual([
      '0001-01',
      '0001-02',
      '0001-03',
      '0001-04',
      '0001-05',
    ]);
  });
});
