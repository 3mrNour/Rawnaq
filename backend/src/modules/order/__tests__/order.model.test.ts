import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Order } from '../order.model.js';
import { Shop } from '../../shop/shop.model.js';

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
  await Order.deleteMany({});
  await Shop.deleteMany({});
});

describe('Order Model & Schema Suite (Task 1.1)', () => {
  it('saving a carpet item without dimensions throws a Mongoose ValidationError', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const priceListRef = new mongoose.Types.ObjectId();

    const orderPromise = Order.create({
      shopId,
      customerName: 'John Doe',
      customerPhone: '99999999',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          priceListRef,
          name: 'Persian Rug',
          category: 'carpet',
          originalPrice: 50,
          finalPrice: 50,
          pricePerMeterSnapshot: 25,
          // Missing dimensions!
        },
      ],
    });

    await expect(orderPromise).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saving an item with different finalPrice and originalPrice but no overrideReason throws a ValidationError', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const priceListRef = new mongoose.Types.ObjectId();

    const orderPromise = Order.create({
      shopId,
      customerName: 'Jane Doe',
      customerPhone: '88888888',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          priceListRef,
          name: 'Shirt',
          category: 'apparel',
          serviceOption: 'fullService',
          originalPrice: 10,
          finalPrice: 8, // Discounted
          // Missing overrideReason!
        },
      ],
    });

    await expect(orderPromise).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('successfully saves a valid multi-category order with apparel, carpet, and linen items', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const priceListRef = new mongoose.Types.ObjectId();

    const order = await Order.create({
      shopId,
      orderNumber: '0001',
      customerName: 'Valid Customer',
      customerPhone: '77777777',
      deliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          itemId: '0001-01',
          priceListRef,
          name: 'Suit',
          category: 'apparel',
          serviceOption: 'fullService',
          originalPrice: 20,
          finalPrice: 20,
        },
        {
          itemId: '0001-02',
          priceListRef,
          name: 'Rug',
          category: 'carpet',
          dimensions: { length: 2, width: 3, area: 6 },
          pricePerMeterSnapshot: 15,
          originalPrice: 90,
          finalPrice: 80,
          overrideReason: 'VIP Customer Discount',
        },
        {
          itemId: '0001-03',
          priceListRef,
          name: 'Bed Sheet',
          category: 'linen',
          originalPrice: 12,
          finalPrice: 12,
        },
      ],
    });

    expect(order).toBeDefined();
    expect(order.items).toHaveLength(3);
    expect(order.items[0].category).toBe('apparel');
    expect(order.items[1].category).toBe('carpet');
    expect(order.items[2].category).toBe('linen');
    expect(order.items[1].overrideReason).toBe('VIP Customer Discount');
  });
});
