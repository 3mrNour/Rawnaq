import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Shop } from '../shop/shop.model.js';
import { StaffMember } from '../staff/staff.model.js';
import { AppError } from '../../utils/AppError.js';
import { enforceDeviceLock } from '../../middleware/deviceLock.middleware.js';

export const loginTenant = async (
  shopLicenseKeyOrSlug: string,
  email: string,
  passwordUnHashed: string,
  deviceFingerprint: string
) => {
  // 1. Look up the shop by licenseKey (case and whitespace insensitive)
  const cleanKey = shopLicenseKeyOrSlug ? shopLicenseKeyOrSlug.trim().toUpperCase() : '';
  const shop = await Shop.findOne({ licenseKey: cleanKey });
  if (!shop) {
    throw new AppError(401, 'Invalid credentials');
  }

  // 2. Look up the StaffMember by email and shopId (case and whitespace insensitive)
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const staff = await StaffMember.findOne({ 
    email: cleanEmail, 
    shopId: shop._id 
  });
  if (!staff || !staff.passwordHash) {
    throw new AppError(401, 'Invalid credentials');
  }

  // 3. Verify password
  const isValid = await bcrypt.compare(passwordUnHashed, staff.passwordHash);
  if (!isValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  // 4. Enforce Device Lock (binds if null, or rejects if mismatched)
  await enforceDeviceLock(shop, deviceFingerprint);

  // 5. Generate JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const token = jwt.sign(
    { 
      sub: staff._id.toString(), 
      shopId: shop._id.toString(), 
      role: staff.role 
    },
    secret,
    { expiresIn: '1d' } // Usually configurable, 1 day for POS sessions
  );

  return { token, shop, staff };
};
