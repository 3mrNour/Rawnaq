import mongoose from 'mongoose';
import { Counter } from './counter.model.js';

/**
 * Generates a zero-padded, shop-scoped sequential order number (e.g., "0001", "0002").
 * Uses atomic findOneAndUpdate to prevent race conditions during concurrent requests.
 * 
 * @param shopId The shop ID (string or ObjectId)
 * @returns A zero-padded string sequence
 */
export const generateOrderNumber = async (shopId: string | mongoose.Types.ObjectId): Promise<string> => {
  const shopObjectId = typeof shopId === 'string' ? new mongoose.Types.ObjectId(shopId) : shopId;

  // Ensure unique index is ready to prevent unindexed duplicate inserts during cold start races
  await Counter.init();

  let counter;
  let retries = 5;

  while (retries > 0) {
    try {
      counter = await Counter.findOneAndUpdate(
        { shopId: shopObjectId },
        { $inc: { sequence: 1 } },
        { upsert: true, new: true }
      );
      break;
    } catch (err: any) {
      // If duplicate key error (E11000) occurs during concurrent upsert race, retry
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        retries--;
        if (retries === 0) throw err;
        // Brief yield to allow the winning insert to complete
        await new Promise(resolve => setTimeout(resolve, 5));
      } else {
        throw err;
      }
    }
  }

  if (!counter) {
    throw new Error('Failed to generate order number after retries');
  }

  return String(counter.sequence).padStart(4, '0');
};

/**
 * Generates a per-item sticker ID traceable back to the order (e.g., "0001-01").
 * 
 * @param orderNumber The zero-padded order number (e.g., "0001")
 * @param itemIndex The 0-based index of the item in the order's items array
 * @returns Formatted item ID (e.g., "0001-01")
 */
export const generateItemId = (orderNumber: string, itemIndex: number): string => {
  const paddedIndex = String(itemIndex + 1).padStart(2, '0');
  return `${orderNumber}-${paddedIndex}`;
};
