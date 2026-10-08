import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state: string;
  pincode?: string;
  gstin?: string;
  creditLimit: number;
  creditDays: number;
  currentBalance: number;
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      default: 'Andhra Pradesh',
    },
    pincode: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    creditDays: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ phone: 1 });
customerSchema.index({ name: 'text', phone: 'text' });
customerSchema.index({ gstin: 1 });
customerSchema.index({ isActive: 1 });

export const Customer: Model<ICustomer> = mongoose.model<ICustomer>('Customer', customerSchema);
