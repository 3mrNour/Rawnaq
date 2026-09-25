import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SuperAdmin } from './superAdmin.model.js';
import { AppError } from '../../utils/AppError.js';

export const loginSuperAdmin = async (email: string, password: string): Promise<string> => {
  const admin = await SuperAdmin.findOne({ email });

  if (!admin) {
    // Return generic 401
    throw new AppError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);

  if (!isMatch) {
    throw new AppError(401, 'Invalid credentials');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Token expires in 7 days for testing, per user request (normally 15m)
  const token = jwt.sign(
    { sub: admin._id, role: 'superadmin' },
    secret,
    { expiresIn: '7d' }
  );

  return token;
};
