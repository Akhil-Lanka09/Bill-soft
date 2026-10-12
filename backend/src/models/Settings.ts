import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config';

export interface ISettings extends Document {
  businessName: string;
  businessLogo?: string;
  address?: string;
  city?: string;
  state: string;
  pincode?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankBranch?: string;
  upiId?: string;
  invoicePrefix: string;
  currentFinancialYear: string;
  timezone: string;
  currency: string;
  gstStateCode: string;
  defaultLowStockThreshold: number;
  maxAgentDiscountPercent: number;
  maxAgentDiscountAmount: number;
  discountRequiresOverride: boolean;
  lineDiscountAllowed: boolean;
  billDiscountAllowed: boolean;
  allowNegativeStockSale: boolean;
  negativeStockRequiresOverride: boolean;
  overridePinHash: string;
  overrideFailedAttempts: number;
  overrideLockUntil?: Date;
  invoiceTerms?: string;
  receiptFooter?: string;
  enabledPaymentMethods: string[];
  thermalPrinterWidth: number;
  createdAt: Date;
  updatedAt: Date;
  verifyOverridePin(pin: string): Promise<boolean>;
}

const settingsSchema = new Schema<ISettings>(
  {
    businessName: {
      type: String,
      required: true,
      default: 'Vijaya Nursery',
    },
    businessLogo: String,
    address: String,
    city: String,
    state: {
      type: String,
      required: true,
      default: 'Andhra Pradesh',
    },
    pincode: String,
    gstin: String,
    phone: String,
    email: String,
    bankName: String,
    bankAccount: String,
    bankIfsc: String,
    bankBranch: String,
    upiId: String,
    invoicePrefix: {
      type: String,
      required: true,
      default: 'VN',
    },
    currentFinancialYear: {
      type: String,
      required: true,
      default: '2026-27',
    },
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    gstStateCode: {
      type: String,
      required: true,
      default: '37',
    },
    defaultLowStockThreshold: {
      type: Number,
      default: 15,
    },
    maxAgentDiscountPercent: {
      type: Number,
      default: 5,
    },
    maxAgentDiscountAmount: {
      type: Number,
      default: 500,
    },
    discountRequiresOverride: {
      type: Boolean,
      default: true,
    },
    lineDiscountAllowed: {
      type: Boolean,
      default: true,
    },
    billDiscountAllowed: {
      type: Boolean,
      default: true,
    },
    allowNegativeStockSale: {
      type: Boolean,
      default: false,
    },
    negativeStockRequiresOverride: {
      type: Boolean,
      default: true,
    },
    overridePinHash: {
      type: String,
      required: true,
      select: false,
    },
    overrideFailedAttempts: {
      type: Number,
      default: 0,
    },
    overrideLockUntil: Date,
    invoiceTerms: {
      type: String,
      default: 'Goods once sold will not be taken back or exchanged. Subject to Andhra Pradesh jurisdiction.',
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for shopping at Vijaya Nursery!',
    },
    enabledPaymentMethods: {
      type: [String],
      default: ['cash', 'upi', 'card', 'bank_transfer', 'credit'],
    },
    thermalPrinterWidth: {
      type: Number,
      default: 80,
    },
  },
  {
    timestamps: true,
  }
);

settingsSchema.methods.verifyOverridePin = async function (pin: string): Promise<boolean> {
  return bcrypt.compare(pin, this.overridePinHash);
};

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    const hash = await bcrypt.hash('9900', config.auth.saltRounds);
    settings = await this.create({ overridePinHash: hash });
  }
  return settings;
};

export const Settings: Model<ISettings> = mongoose.model<ISettings>('Settings', settingsSchema);
