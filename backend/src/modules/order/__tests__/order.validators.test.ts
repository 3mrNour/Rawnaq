import { createOrderSchema, getOrdersSchema, orderIdParamSchema } from '../order.validators.js';
import mongoose from 'mongoose';

describe('Order Validation Suite (Task 2.2)', () => {
  const validPriceListRef = new mongoose.Types.ObjectId().toString();

  const getValidPayload = () => ({
    body: {
      customerName: 'John Doe',
      customerPhone: '12345678',
      deliveryDate: new Date(Date.now() + 86400000).toISOString(),
      items: [
        {
          priceListRef: validPriceListRef,
          name: 'Shirt',
          category: 'apparel',
          serviceOption: 'fullService',
          originalPrice: 15,
          finalPrice: 15,
        },
      ],
    },
  });

  it('successfully validates a valid create order request', () => {
    const payload = getValidPayload();
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects when customerName is missing or empty', () => {
    const payload = getValidPayload();
    payload.body.customerName = '';
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('customerName');
    }
  });

  it('rejects when customerPhone is less than 5 characters', () => {
    const payload = getValidPayload();
    payload.body.customerPhone = '1234';
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('customerPhone');
    }
  });

  it('rejects when deliveryDate is in the past', () => {
    const payload = getValidPayload();
    payload.body.deliveryDate = new Date(Date.now() - 86400000).toISOString();
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('deliveryDate');
    }
  });

  it('rejects items where finalPrice !== originalPrice when overrideReason is missing, asserting exact error path ["body", "items", 0, "overrideReason"]', () => {
    const payload = getValidPayload();
    payload.body.items[0].originalPrice = 20;
    payload.body.items[0].finalPrice = 15; // discounted without reason
    delete (payload.body.items[0] as any).overrideReason;

    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.join('.') === 'body.items.0.overrideReason'
      );
      expect(issue).toBeDefined();
      expect(issue?.path).toEqual(['body', 'items', 0, 'overrideReason']);
      expect(issue?.message).toBe('overrideReason is required when finalPrice differs from originalPrice');
    }
  });

  it('validates items where finalPrice !== originalPrice when overrideReason is provided', () => {
    const payload = getValidPayload();
    payload.body.items[0].originalPrice = 20;
    payload.body.items[0].finalPrice = 15;
    (payload.body.items[0] as any).overrideReason = 'Promotional discount';

    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects apparel item without serviceOption', () => {
    const payload = getValidPayload();
    delete (payload.body.items[0] as any).serviceOption;
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects carpet item without valid dimensions', () => {
    const payload = {
      body: {
        customerName: 'Jane Doe',
        customerPhone: '99999999',
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        items: [
          {
            priceListRef: validPriceListRef,
            name: 'Persian Rug',
            category: 'carpet',
            originalPrice: 100,
            finalPrice: 100,
            // missing dimensions
          },
        ],
      },
    };
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates getOrdersSchema query params with defaults', () => {
    const result = getOrdersSchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    }
  });

  it('validates orderIdParamSchema with valid hex ObjectId', () => {
    const result = orderIdParamSchema.safeParse({ params: { id: validPriceListRef } });
    expect(result.success).toBe(true);
  });
});
