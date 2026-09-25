import mongoose, { Schema, Document } from 'mongoose';
import { IShop } from '../../types/rawnaq.types.js';

export interface IShopDocument extends Omit<IShop, 'id'>, Document {}

const priceListItemSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { discriminatorKey: 'category' }
);

const shopSchema = new Schema<IShopDocument>(
  {
    name: { type: String, required: true },
    licenseKey: { type: String, required: true, unique: true },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'suspended', 'expired'],
      default: 'active',
    },
    expiryDate: { type: Date, required: true },
    dailyCapacityLimit: { type: Number, required: true, min: 0 },
    deviceFingerprint: { type: String, default: null },
    priceList: [priceListItemSchema],
  },
  {
    timestamps: true,
  }
);

const priceListArray = shopSchema.path('priceList') as mongoose.Schema.Types.DocumentArray;

priceListArray.discriminator(
  'apparel',
  new Schema({
    pricing: {
      fullService: { type: Number, required: true },
      ironOnly: { type: Number, required: true },
    },
  })
);

priceListArray.discriminator(
  'carpet',
  new Schema({
    pricePerMeter: { type: Number, required: true },
  })
);

priceListArray.discriminator(
  'linen',
  new Schema({
    basePrice: { type: Number, required: true },
  })
);

export const Shop = mongoose.model<IShopDocument>('Shop', shopSchema);
