import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 'text' });
supplierSchema.index({ gstin: 1 });

export const Supplier: Model<ISupplier> = mongoose.model<ISupplier>('Supplier', supplierSchema);

// ==================== PURCHASE ====================

export interface IPurchaseItem {
  product: Types.ObjectId;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQuantity: number;
  costPrice: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  discount: number;
  lineTotal: number;
}

export interface IPurchase extends Document {
  purchaseNumber: string;
  supplier: Types.ObjectId;
  supplierName: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: Date;
  purchaseDate: Date;
  items: IPurchaseItem[];
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount: number;
  status: 'draft' | 'approved' | 'partially_received' | 'received' | 'cancelled';
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema<IPurchaseItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  receivedQuantity: { type: Number, default: 0 },
  costPrice: { type: Number, required: true },
  gstRate: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
}, { _id: true });

const purchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: { type: String, required: true, unique: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String, required: true },
    supplierInvoiceNumber: { type: String, trim: true },
    supplierInvoiceDate: Date,
    purchaseDate: { type: Date, required: true, default: Date.now },
    items: { type: [purchaseItemSchema], required: true },
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'approved', 'partially_received', 'received', 'cancelled'], default: 'draft' },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ supplierInvoiceNumber: 1, supplier: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ status: 1 });

export const Purchase: Model<IPurchase> = mongoose.model<IPurchase>('Purchase', purchaseSchema);
