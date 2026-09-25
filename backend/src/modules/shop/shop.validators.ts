import { z } from 'zod';

export const apparelPricingSchema = z.object({
  category: z.literal('apparel'),
  name: z.string().min(1),
  pricing: z.object({
    fullService: z.number().min(0),
    ironOnly: z.number().min(0),
  }),
});

export const carpetPricingSchema = z.object({
  category: z.literal('carpet'),
  name: z.string().min(1),
  pricePerMeter: z.number().min(0),
});

export const linenPricingSchema = z.object({
  category: z.literal('linen'),
  name: z.string().min(1),
  basePrice: z.number().min(0),
});

export const priceListItemZodSchema = z.discriminatedUnion('category', [
  apparelPricingSchema,
  carpetPricingSchema,
  linenPricingSchema,
]);

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    dailyCapacityLimit: z.number().int().positive(),
    expiryDate: z.string().datetime().refine((val) => new Date(val) > new Date(), {
      message: 'Expiry date must be in the future',
    }),
    priceList: z.array(priceListItemZodSchema).optional(),
  }),
});

export const extendExpirySchema = z.object({
  body: z.object({
    newExpiryDate: z.string().datetime(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const setStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'suspended', 'expired']),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const shopIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
