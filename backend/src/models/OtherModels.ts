import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ==================== CREDIT NOTE ====================

export interface ICreditNoteItem {
  product: Types.ObjectId;
  productName: string;
  quantity: number;
  rate: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  lineTotal: number;
}

export interface ICreditNote extends Document {
  creditNoteNumber: string;
  originalBill: Types.ObjectId;
  originalInvoiceNumber: string;
  customer?: Types.ObjectId;
  customerName?: string;
  type: 'full_return' | 'partial_return';
  items: ICreditNoteItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  reason: string;
  stockRestored: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const creditNoteItemSchema = new Schema<ICreditNoteItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
}, { _id: true });

const creditNoteSchema = new Schema<ICreditNote>(
  {
    creditNoteNumber: { type: String, required: true, unique: true },
    originalBill: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    originalInvoiceNumber: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: String,
    type: { type: String, enum: ['full_return', 'partial_return'], required: true },
    items: { type: [creditNoteItemSchema], required: true },
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    reason: { type: String, required: true },
    stockRestored: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

creditNoteSchema.index({ originalBill: 1 });
creditNoteSchema.index({ createdAt: -1 });

export const CreditNote: Model<ICreditNote> = mongoose.model<ICreditNote>('CreditNote', creditNoteSchema);

// ==================== CUSTOMER PAYMENT ====================

export interface ICustomerPayment extends Document {
  customer: Types.ObjectId;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer';
  referenceId?: string;
  bill?: Types.ObjectId;
  notes?: string;
  receivedBy: Types.ObjectId;
  receivedByName: string;
  createdAt: Date;
}

const customerPaymentSchema = new Schema<ICustomerPayment>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer'], required: true },
    referenceId: String,
    bill: { type: Schema.Types.ObjectId, ref: 'Bill' },
    notes: String,
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receivedByName: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

customerPaymentSchema.index({ customer: 1, createdAt: -1 });
customerPaymentSchema.index({ createdAt: -1 });

export const CustomerPayment: Model<ICustomerPayment> = mongoose.model<ICustomerPayment>('CustomerPayment', customerPaymentSchema);

// ==================== EXPENSE ====================

export interface IExpense extends Document {
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer';
  referenceId?: string;
  attachment?: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      required: true,
      enum: ['labour', 'transport', 'electricity', 'rent', 'maintenance', 'packaging', 'marketing', 'nursery_supplies', 'miscellaneous'],
    },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer'], required: true },
    referenceId: String,
    attachment: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ date: -1 });

export const Expense: Model<IExpense> = mongoose.model<IExpense>('Expense', expenseSchema);

// ==================== DAILY CLOSING ====================

export interface IDailyClosing extends Document {
  date: Date;
  financialYear: string;
  openingCash: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  bankSales: number;
  creditSales: number;
  totalSales: number;
  customerPayments: number;
  returns: number;
  expenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  differenceReason?: string;
  totalBills: number;
  totalItems: number;
  closedBy: Types.ObjectId;
  closedByName: string;
  notes?: string;
  createdAt: Date;
}

const dailyClosingSchema = new Schema<IDailyClosing>(
  {
    date: { type: Date, required: true },
    financialYear: { type: String, required: true },
    openingCash: { type: Number, required: true, default: 0 },
    cashSales: { type: Number, default: 0 },
    upiSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    bankSales: { type: Number, default: 0 },
    creditSales: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    customerPayments: { type: Number, default: 0 },
    returns: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number, required: true },
    difference: { type: Number, default: 0 },
    differenceReason: String,
    totalBills: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    closedByName: { type: String, required: true },
    notes: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

dailyClosingSchema.index({ date: -1 });
dailyClosingSchema.index({ financialYear: 1 });

export const DailyClosing: Model<IDailyClosing> = mongoose.model<IDailyClosing>('DailyClosing', dailyClosingSchema);

// ==================== STOCK TRANSFER ====================

export interface IStockTransferItem {
  product: Types.ObjectId;
  productName: string;
  productSku: string;
  quantity: number;
}

export interface IStockTransfer extends Document {
  transferNumber: string;
  sourceLocation: string;
  destinationLocation: string;
  items: IStockTransferItem[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  createdBy: Types.ObjectId;
  createdByName: string;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stockTransferItemSchema = new Schema<IStockTransferItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: true });

const stockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNumber: { type: String, required: true, unique: true },
    sourceLocation: { type: String, required: true },
    destinationLocation: { type: String, required: true },
    items: { type: [stockTransferItemSchema], required: true },
    status: { type: String, enum: ['pending', 'in_transit', 'completed', 'cancelled'], default: 'pending' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    completedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

stockTransferSchema.index({ status: 1, createdAt: -1 });

export const StockTransfer: Model<IStockTransfer> = mongoose.model<IStockTransfer>('StockTransfer', stockTransferSchema);

// ==================== TAX RULE ====================

export interface ITaxRule extends Document {
  hsn: string;
  description: string;
  taxRate: number;
  taxType: 'gst' | 'nil' | 'exempt';
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taxRuleSchema = new Schema<ITaxRule>(
  {
    hsn: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    taxRate: { type: Number, required: true, default: 0 },
    taxType: { type: String, enum: ['gst', 'nil', 'exempt'], default: 'gst' },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

taxRuleSchema.index({ hsn: 1, isActive: 1 });
taxRuleSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

export const TaxRule: Model<ITaxRule> = mongoose.model<ITaxRule>('TaxRule', taxRuleSchema);

// ==================== HELD BILL ====================

export interface IHeldBill extends Document {
  agent: Types.ObjectId;
  agentName: string;
  customer?: Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  items: any[];
  subtotal: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const heldBillSchema = new Schema<IHeldBill>(
  {
    agent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    agentName: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: String,
    customerPhone: String,
    items: { type: Schema.Types.Mixed, required: true },
    subtotal: { type: Number, default: 0 },
    notes: String,
  },
  { timestamps: true }
);

heldBillSchema.index({ agent: 1, createdAt: -1 });

export const HeldBill: Model<IHeldBill> = mongoose.model<IHeldBill>('HeldBill', heldBillSchema);

// ==================== INVOICE COUNTER ====================

export interface IInvoiceCounter extends Document {
  financialYear: string;
  prefix: string;
  currentSequence: number;
}

const invoiceCounterSchema = new Schema<IInvoiceCounter>({
  financialYear: { type: String, required: true },
  prefix: { type: String, required: true },
  currentSequence: { type: Number, required: true, default: 0 },
});

invoiceCounterSchema.index({ financialYear: 1, prefix: 1 }, { unique: true });

export const InvoiceCounter: Model<IInvoiceCounter> = mongoose.model<IInvoiceCounter>('InvoiceCounter', invoiceCounterSchema);
