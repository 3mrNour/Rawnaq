import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { SuperAdmin } from '../modules/adminAuth/superAdmin.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be provided in the environment variables.');
      process.exit(1);
    }

    await connectDB();

    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      console.log('SuperAdmin already exists. Exiting.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await SuperAdmin.create({
      email,
      passwordHash,
    });

    console.log('SuperAdmin seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed SuperAdmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
