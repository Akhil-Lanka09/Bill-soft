import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IStockLedger extends Document {
  product: Types.ObjectId;
  productName: string;
  productSku: string;
  movementType: 'opening' | 'sale' | 'purchase' | 'return' | 'adjustment_in' | 'adjustment_out' |
    'damage' | 'mortality' | 'theft' | 'transfer_in' | 'transfer_out' | 'stock_override' | 'reconciliation';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reference?: string;
  referenceType?: 'bill' | 'purchase' | 'return' | 'adjustment' | 'transfer' | 'override' | 'reconciliation';
  referenceId?: Types.ObjectId;
  user: Types.ObjectId;
  userName: string;
  reason?: string;
  location?: string;
  createdAt: Date;
}

const stockLedgerSchema = new Schema<IStockLedger>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSku: {
      type: String,
      required: true,
    },
    movementType: {
      type: String,
      enum: ['opening', 'sale', 'purchase', 'return', 'adjustment_in', 'adjustment_out',
        'damage', 'mortality', 'theft', 'transfer_in', 'transfer_out', 'stock_override', 'reconciliation'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    reference: String,
    referenceType: {
      type: String,
      enum: ['bill', 'purchase', 'return', 'adjustment', 'transfer', 'override', 'reconciliation'],
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    reason: String,
    location: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Append-only: no update methods
stockLedgerSchema.index({ product: 1, createdAt: -1 });
stockLedgerSchema.index({ movementType: 1, createdAt: -1 });
stockLedgerSchema.index({ referenceId: 1, referenceType: 1 });
stockLedgerSchema.index({ user: 1, createdAt: -1 });
stockLedgerSchema.index({ createdAt: -1 });

export const StockLedger: Model<IStockLedger> = mongoose.model<IStockLedger>('StockLedger', stockLedgerSchema);
