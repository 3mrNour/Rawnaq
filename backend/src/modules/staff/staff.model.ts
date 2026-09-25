import mongoose, { Schema, Document } from 'mongoose';
import { IStaffMember } from '../../types/rawnaq.types.js';

export interface IStaffMemberDocument extends Omit<IStaffMember, 'id' | 'shopId'>, Document {
  shopId: mongoose.Types.ObjectId;
}

const staffMemberSchema = new Schema<IStaffMemberDocument>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true },
    email: { 
      type: String, 
      sparse: true, 
      unique: true, 
      trim: true, 
      lowercase: true 
    },
    passwordHash: { type: String },
    pinCode: { type: String, minlength: 4, maxlength: 4 },
    role: {
      type: String,
      enum: ['owner', 'cashier', null],
      default: null,
    },
    workerType: {
      type: String,
      enum: ['dry-cleaner', 'ironer', 'none'],
      default: 'none',
    },
    payType: {
      type: String,
      enum: ['percentage', 'fixed-daily', 'fixed-per-piece'],
    },
    payValue: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

staffMemberSchema.index({ shopId: 1, pinCode: 1 }, { unique: true, sparse: true });

// Ensure that email is required for owner and cashier
staffMemberSchema.pre('save', function (next) {
  if (['owner', 'cashier'].includes(this.role as string)) {
    if (!this.email || !this.passwordHash) {
      return next(new Error('Email and passwordHash are required for dashboard access (owner/cashier)'));
    }
  }

  if (this.workerType !== 'none') {
    if (!this.payType || this.payValue === undefined || this.payValue === null) {
      return next(new Error('payType and payValue are required when workerType is not none'));
    }
  }

  next();
});

export const StaffMember = mongoose.model<IStaffMemberDocument>('StaffMember', staffMemberSchema);
