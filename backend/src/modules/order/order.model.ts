import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'received' | 'ready' | 'delivered';
export type ServiceCategory = 'apparel' | 'carpet' | 'linen';
export type ServiceOption = 'fullService' | 'ironOnly';

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  itemId?: string;
  priceListRef: mongoose.Types.ObjectId;
  name: string;
  category: ServiceCategory;
  originalPrice: number;
  finalPrice: number;
  overrideReason?: string;
  assignedWorkerId?: mongoose.Types.ObjectId | null;
  workerRateSnapshot?: number | null;
  assignedAt?: Date | null;
  serviceOption?: ServiceOption;
  dimensions?: {
    length: number;
    width: number;
    area: number;
  };
  pricePerMeterSnapshot?: number;
}

export interface IOrderDocument extends Document {
  shopId: mongoose.Types.ObjectId;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  deliveryDate: Date;
  items: IOrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema(
  {
    itemId: { type: String },
    priceListRef: { type: Schema.Types.ObjectId, ref: 'Shop.priceList', required: true },
    name: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    overrideReason: { type: String },
    assignedWorkerId: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
    workerRateSnapshot: { type: Number, default: null },
    assignedAt: { type: Date, default: null },
  },
  { discriminatorKey: 'category' }
);

orderItemSchema.pre('validate', function (next) {
  if (
    this.finalPrice !== undefined &&
    this.originalPrice !== undefined &&
    this.finalPrice !== this.originalPrice
  ) {
    if (!this.overrideReason || this.overrideReason.trim() === '') {
      this.invalidate('overrideReason', 'overrideReason is required when finalPrice differs from originalPrice');
    }
  }
  next();
});

const orderSchema = new Schema<IOrderDocument>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    orderNumber: { type: String },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    status: {
      type: String,
      enum: ['received', 'ready', 'delivered'],
      default: 'received',
    },
    deliveryDate: { type: Date, required: true },
    items: [orderItemSchema],
  },
  {
    timestamps: true,
  }
);

// Unique compound index on shopId and orderNumber
orderSchema.index(
  { shopId: 1, orderNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { orderNumber: { $exists: true, $type: 'string' } },
  }
);

const orderItemsArray = orderSchema.path('items') as mongoose.Schema.Types.DocumentArray;

orderItemsArray.discriminator(
  'apparel',
  new Schema({
    serviceOption: {
      type: String,
      enum: ['fullService', 'ironOnly'],
      required: true,
    },
  })
);

orderItemsArray.discriminator(
  'carpet',
  new Schema({
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      area: { type: Number, required: true },
    },
    pricePerMeterSnapshot: { type: Number, required: true },
  })
);

orderItemsArray.discriminator(
  'linen',
  new Schema({})
);

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
