import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IBillItem {
  product: Types.ObjectId;
  productName: string;
  productSku: string;
  variant?: string;
  hsn: string;
  quantity: number;
  rate: number;
  discountType?: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  lineTotal: number;
  stockBefore: number;
  stockAfter: number;
  overrideApplied: boolean;
  overrideReason?: string;
}

export interface IPaymentDetail {
  method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit';
  amount: number;
  referenceId?: string;
  receivedAmount?: number;
  changeAmount?: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface IBill extends Document {
  invoiceNumber: string;
  financialYear: string;
  sequenceNumber: number;
  billDate: Date;
  billType: 'tax_invoice' | 'bill_of_supply';
  agent: Types.ObjectId;
  agentName: string;
  customer?: Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerState?: string;
  isInterState: boolean;
  items: IBillItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue: number;
  billDiscountAmount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  preRoundTotal: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  payments: IPaymentDetail[];
  paymentStatus: 'paid' | 'partial' | 'credit' | 'pending';
  totalPaid: number;
  balanceDue: number;
  status: 'active' | 'cancelled' | 'returned' | 'partially_returned';
  cancelReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  notes?: string;
  idempotencyKey: string;
  overrideUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const billItemSchema = new Schema<IBillItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  variant: String,
  hsn: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
  stockBefore: { type: Number, required: true },
  stockAfter: { type: Number, required: true },
  overrideApplied: { type: Boolean, default: false },
  overrideReason: String,
}, { _id: true });

const paymentDetailSchema = new Schema<IPaymentDetail>({
  method: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer', 'credit'],
    required: true,
  },
  amount: { type: Number, required: true },
  referenceId: String,
  receivedAmount: Number,
  changeAmount: Number,
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
  },
}, { _id: true });

const billSchema = new Schema<IBill>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    financialYear: {
      type: String,
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    billType: {
      type: String,
      enum: ['tax_invoice', 'bill_of_supply'],
      required: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: String,
    customerPhone: String,
    customerGstin: String,
    customerState: String,
    isInterState: {
      type: Boolean,
      default: false,
    },
    items: {
      type: [billItemSchema],
      required: true,
      validate: {
        validator: function (items: IBillItem[]) {
          return items.length > 0;
        },
        message: 'Bill must have at least one item',
      },
    },
    subtotal: { type: Number, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: { type: Number, default: 0 },
    billDiscountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    preRoundTotal: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, required: true },
    payments: [paymentDetailSchema],
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'credit', 'pending'],
      default: 'pending',
    },
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'returned', 'partially_returned'],
      default: 'active',
    },
    cancelReason: String,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    notes: String,
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    overrideUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
billSchema.index({ invoiceNumber: 1 });
billSchema.index({ financialYear: 1, sequenceNumber: 1 });
billSchema.index({ status: 1, billDate: -1 });
billSchema.index({ agent: 1, billDate: -1 });
billSchema.index({ customer: 1, billDate: -1 });
billSchema.index({ billDate: -1 });
billSchema.index({ paymentStatus: 1 });
billSchema.index({ createdAt: -1 });

export const Bill: Model<IBill> = mongoose.model<IBill>('Bill', billSchema);
