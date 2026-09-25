import { z } from 'zod';
import { priceListItemZodSchema, apparelPricingSchema, carpetPricingSchema, linenPricingSchema } from '../shop/shop.validators.js';

export const addPriceListItemSchema = z.object({
  body: priceListItemZodSchema,
});

// For update, we want to allow partial updates but we can't easily deep-partial a discriminated union.
// In practice, since we know the category, we could just allow partial properties or build a specific partial schema.
// A simpler way: just let it pass as a record or build a custom refining schema.
export const updatePriceListItemSchema = z.object({
  params: z.object({
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    pricing: z.object({
      fullService: z.number().min(0).optional(),
      ironOnly: z.number().min(0).optional(),
    }).optional(),
    pricePerMeter: z.number().min(0).optional(),
    basePrice: z.number().min(0).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});

export const itemIdParamSchema = z.object({
  params: z.object({
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID'),
  }),
});
