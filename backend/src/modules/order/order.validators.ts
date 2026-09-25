import { z } from 'zod';

const deliveryDateSchema = z
  .union([z.string(), z.date()])
  .refine((val) => {
    const date = typeof val === 'string' ? new Date(val) : val;
    return !isNaN(date.getTime());
  }, { message: 'Invalid delivery date' })
  .transform((val) => (typeof val === 'string' ? new Date(val) : val))
  .refine((date) => date > new Date(), {
    message: 'Delivery date must be in the future',
  });

const baseItemSchema = z.object({
  priceListRef: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid price list ref ID'),
  name: z.string().min(1, 'Name is required'),
  originalPrice: z.number().min(0).optional(),
  finalPrice: z.number().min(0).optional(),
  overrideReason: z.string().optional(),
  assignedWorkerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid worker ID').optional().nullable(),
  workerRateSnapshot: z.number().min(0).optional().nullable(),
});

const apparelItemSchema = baseItemSchema.extend({
  category: z.literal('apparel'),
  serviceOption: z.enum(['fullService', 'ironOnly']),
});

const carpetItemSchema = baseItemSchema.extend({
  category: z.literal('carpet'),
  dimensions: z.object({
    length: z.number().positive('Length must be positive'),
    width: z.number().positive('Width must be positive'),
    area: z.number().positive().optional(),
  }),
  pricePerMeterSnapshot: z.number().min(0).optional(),
});

const linenItemSchema = baseItemSchema.extend({
  category: z.literal('linen'),
});

export const orderItemZodSchema = z.discriminatedUnion('category', [
  apparelItemSchema,
  carpetItemSchema,
  linenItemSchema,
]);

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerPhone: z.string().min(5, 'Customer phone must be at least 5 characters'),
    deliveryDate: deliveryDateSchema,
    items: z.array(orderItemZodSchema).min(1, 'At least one item is required'),
  }).superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (
        item.finalPrice !== undefined &&
        item.originalPrice !== undefined &&
        item.finalPrice !== item.originalPrice
      ) {
        if (!item.overrideReason || item.overrideReason.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'overrideReason is required when finalPrice differs from originalPrice',
            path: ['items', index, 'overrideReason'],
          });
        }
      }
    });
  }),
});

export const getOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['received', 'ready', 'delivered']).optional(),
    search: z.string().optional(),
    page: z.union([z.string().regex(/^\d+$/).transform(Number), z.number().int().positive()]).optional().default(1),
    limit: z.union([z.string().regex(/^\d+$/).transform(Number), z.number().int().positive()]).optional().default(10),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
  body: z.object({
    status: z.enum(['received', 'ready', 'delivered'], {
      errorMap: () => ({ message: 'Status must be one of: received, ready, delivered' }),
    }),
  }),
});

