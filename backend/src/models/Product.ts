import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IProductVariant {
  name: string;
  sku?: string;
  barcode?: string;
  sellingPrice: number | null;
  costPrice?: number;
  minimumSellingPrice?: number;
  currentStock: number;
  lowStockThreshold: number;
  hsn?: string;
  gstRate: number;
  isActive: boolean;
}

export interface IProduct extends Document {
  sku: string;
  barcode?: string;
  name: string;
  localName?: string;
  botanicalName?: string;
  category: Types.ObjectId;
  variant?: string;
  size?: string;
  unit: string;
  sellingPrice: number | null;
  costPrice?: number;
  minimumSellingPrice?: number;
  hsn: string;
  gstRate: number;
  taxType: 'exclusive' | 'inclusive';
  taxCategory: 'taxable' | 'nil-rated' | 'exempt';
  openingStock: number;
  currentStock: number;
  lowStockThreshold: number;
  images: string[];
  isActive: boolean;
  isArchived: boolean;
  hasTransactions: boolean;
  priceStatus: 'active' | 'requires_admin_price' | 'requires_admin_review';
  supplier?: Types.ObjectId;
  location?: string;
  batch?: string;
  plantCondition?: 'healthy' | 'damaged' | 'dead' | 'reserved' | 'quarantine';
  plantHeight?: string;
  plantAge?: string;
  variety?: string;
  propagationType?: string;
  potSize?: string;
  variants?: IProductVariant[];
  lastPurchaseCost?: number;
  averageCost?: number;
  needsReconciliation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  barcode: { type: String, trim: true },
  sellingPrice: { type: Number, default: null },
  costPrice: { type: Number },
  minimumSellingPrice: { type: Number },
  currentStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  hsn: { type: String, trim: true },
  gstRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    localName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    botanicalName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    variant: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    size: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      default: 'piece',
      enum: ['piece', 'kg', 'gram', 'litre', 'ml', 'meter', 'foot', 'packet', 'pack', 'bag', 'bundle', 'dozen', 'box'],
    },
    sellingPrice: {
      type: Number,
      default: null,
    },
    costPrice: {
      type: Number,
      select: false,
    },
    minimumSellingPrice: {
      type: Number,
    },
    hsn: {
      type: String,
      required: true,
      trim: true,
      default: '0602',
    },
    gstRate: {
      type: Number,
      required: true,
      default: 0,
    },
    taxType: {
      type: String,
      enum: ['exclusive', 'inclusive'],
      default: 'exclusive',
    },
    taxCategory: {
      type: String,
      enum: ['taxable', 'nil-rated', 'exempt'],
      default: 'nil-rated',
    },
    openingStock: {
      type: Number,
      default: 0,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    images: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    hasTransactions: {
      type: Boolean,
      default: false,
    },
    priceStatus: {
      type: String,
      enum: ['active', 'requires_admin_price', 'requires_admin_review'],
      default: 'active',
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    location: {
      type: String,
      trim: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    plantCondition: {
      type: String,
      enum: ['healthy', 'damaged', 'dead', 'reserved', 'quarantine'],
      default: 'healthy',
    },
    plantHeight: String,
    plantAge: String,
    variety: String,
    propagationType: String,
    potSize: String,
    variants: [productVariantSchema],
    lastPurchaseCost: {
      type: Number,
      select: false,
    },
    averageCost: {
      type: Number,
      select: false,
    },
    needsReconciliation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for product search & fast catalog listing
productSchema.index({ name: 'text', localName: 'text', botanicalName: 'text', sku: 'text' });
productSchema.index({ isActive: 1, isArchived: 1, name: 1 });
productSchema.index({ isActive: 1, isArchived: 1, category: 1, name: 1 });
productSchema.index({ isActive: 1, isArchived: 1, currentStock: 1 });
productSchema.index({ hsn: 1 });
productSchema.index({ priceStatus: 1 });
productSchema.index({ needsReconciliation: 1 });

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
