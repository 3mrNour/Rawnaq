import mongoose from 'mongoose';
import { Shop } from '../src/modules/shop/shop.model.js';
import { StaffMember } from '../src/modules/staff/staff.model.js';
import { config } from 'dotenv';
import { resolve } from 'path';
import bcrypt from 'bcrypt';

config({ path: resolve(process.cwd(), '.env') });

const seedShop = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rawnaq');
    console.log('Connected to DB');

    // Create a shop
    const shop = await Shop.create({
      name: 'E2E Test Shop',
      licenseKey: 'RWNQ-E2E-TEST-2',
      subscriptionStatus: 'active',
      dailyCapacityLimit: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    console.log(`Created shop: ${shop._id}`);

    const passwordHash = await bcrypt.hash('password123', 12);

    // Create an owner
    const owner = await StaffMember.create({
      shopId: shop._id,
      name: 'Owner Admin',
      role: 'owner',
      workerType: 'none',
      email: 'owner3@testshop.com',
      passwordHash
    });

    console.log(`Created owner: ${owner._id}`);
    console.log('----------------------------------------------------');
    console.log('Login Email: owner3@testshop.com');
    console.log('Login Password: password123');
    console.log('Shop ID:', shop._id);
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedShop();
