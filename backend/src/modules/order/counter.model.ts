import mongoose, { Schema, Document } from 'mongoose';

export interface ICounterDocument extends Document {
  shopId: mongoose.Types.ObjectId;
  sequence: number;
}

const counterSchema = new Schema<ICounterDocument>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true },
    sequence: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Counter = mongoose.model<ICounterDocument>('Counter', counterSchema);
