import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { SuperAdmin } from '../modules/adminAuth/superAdmin.model.js';
import { Shop } from '../modules/shop/shop.model.js';
import { StaffMember } from '../modules/staff/staff.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedTestAccounts = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    // 1. Seed Super Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rawnaq.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    let admin = await SuperAdmin.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      admin = await SuperAdmin.create({ email: adminEmail, passwordHash });
      console.log('✅ Created Super Admin account.');
    } else {
      console.log('ℹ️ Super Admin account already exists.');
    }

    // 2. Seed Demo Shop
    const licenseKey = 'RWNQ-DEMO-SHOP';
    let shop = await Shop.findOne({ licenseKey });
    if (!shop) {
      shop = await Shop.create({
        name: 'Rawnaq Demo Laundry',
        licenseKey,
        subscriptionStatus: 'active',
        dailyCapacityLimit: 100,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        deviceFingerprint: null // Clear fingerprint so testing from any browser/device works initially
      });
      console.log('✅ Created Demo Shop (License: RWNQ-DEMO-SHOP).');
    } else {
      // Ensure subscription is active and fingerprint is clear for testing
      shop.subscriptionStatus = 'active';
      shop.deviceFingerprint = null;
      await shop.save();
      console.log('ℹ️ Demo Shop already exists (Updated to active & unlocked device fingerprint).');
    }

    const passwordHash = await bcrypt.hash('password123', 12);

    // 3. Seed Shop Owner
    let owner = await StaffMember.findOne({ email: 'owner@demo.com' });
    if (!owner) {
      owner = await StaffMember.create({
        shopId: shop._id,
        name: 'Ahmad Owner',
        email: 'owner@demo.com',
        passwordHash,
        pinCode: '1001',
        role: 'owner',
        workerType: 'none',
      });
      console.log('✅ Created Shop Owner account.');
    } else {
      owner.passwordHash = passwordHash;
      owner.shopId = shop._id;
      owner.pinCode = '1001';
      await owner.save();
      console.log('ℹ️ Shop Owner account already exists (Password reset to password123).');
    }

    // 4. Seed Shop Cashier
    let cashier = await StaffMember.findOne({ email: 'cashier@demo.com' });
    if (!cashier) {
      cashier = await StaffMember.create({
        shopId: shop._id,
        name: 'Tariq Cashier',
        email: 'cashier@demo.com',
        passwordHash,
        pinCode: '1002',
        role: 'cashier',
        workerType: 'none',
      });
      console.log('✅ Created Shop Cashier account.');
    } else {
      cashier.passwordHash = passwordHash;
      cashier.shopId = shop._id;
      cashier.pinCode = '1002';
      await cashier.save();
      console.log('ℹ️ Shop Cashier account already exists (Password reset to password123).');
    }

    console.log('\n======================================================');
    console.log('🎉 TEST CREDENTIALS READY FOR TESTING 🎉');
    console.log('======================================================\n');
    console.log('1️⃣ SUPER ADMIN (Platform Control Panel):');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Endpoint: POST /api/admin/auth/login\n`);
    console.log('2️⃣ SHOP OWNER (Tenant Dashboard & POS):');
    console.log(`   License:  RWNQ-DEMO-SHOP`);
    console.log(`   Email:    owner@demo.com`);
    console.log(`   Password: password123`);
    console.log(`   Endpoint: POST /api/tenant/auth/login\n`);
    console.log('3️⃣ SHOP CASHIER (POS Order Entry & Receipts):');
    console.log(`   License:  RWNQ-DEMO-SHOP`);
    console.log(`   Email:    cashier@demo.com`);
    console.log(`   Password: password123`);
    console.log(`   Endpoint: POST /api/tenant/auth/login\n`);
    console.log('======================================================');

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed test accounts:', error);
    process.exit(1);
  }
};

seedTestAccounts();
