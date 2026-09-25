import { z } from 'zod';

const staffBaseSchema = {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional(),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters').optional(),
  pinCode: z.string().regex(/^\d{4}$/, 'PIN code must be exactly 4 digits').optional(),
  role: z.enum(['owner', 'cashier']).nullable().optional(),
  workerType: z.enum(['dry-cleaner', 'ironer', 'none']).optional(),
  payType: z.enum(['percentage', 'fixed-daily', 'fixed-per-piece']).optional(),
  payValue: z.number().min(0, 'Pay value must be non-negative').optional(),
};

const validatePayConfig = (data: any) => {
  if (data.workerType && data.workerType !== 'none') {
    if (!data.payType || data.payValue === undefined) {
      return false;
    }
  }
  return true;
};

export const createStaffSchema = z.object({
  body: z.object(staffBaseSchema).refine(validatePayConfig, {
    message: "payType and payValue are required when workerType is not 'none'",
    path: ['payType'],
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  }),
  body: z.object(staffBaseSchema).partial().refine(validatePayConfig, {
    message: "payType and payValue are required when workerType is not 'none'",
    path: ['payType'],
  }),
});

export const staffIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  }),
});
