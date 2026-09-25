import mongoose from 'mongoose';
import { Shop } from '../src/modules/shop/shop.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/rawnaq');
  await Shop.updateOne({ licenseKey: 'RWNQ-E2E-TEST-2' }, { $unset: { deviceFingerprint: 1 } });
  console.log('Unlocked shop device');
  process.exit(0);
};

run();
