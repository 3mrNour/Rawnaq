import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    shopLicenseKeyOrSlug: z.string().min(1, 'Shop license key is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
  }),
});
