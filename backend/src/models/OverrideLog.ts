import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IOverrideLog extends Document {
  action: string;
  agent: Types.ObjectId;
  agentName: string;
  bill?: Types.ObjectId;
  invoiceNumber?: string;
  product?: Types.ObjectId;
  productName?: string;
  originalValue?: number;
  overrideValue?: number;
  discountAmount?: number;
  reason: string;
  result: 'approved' | 'rejected' | 'locked';
  approverIdentity: string;
  attemptNumber: number;
  ip?: string;
  createdAt: Date;
}

const overrideLogSchema = new Schema<IOverrideLog>(
  {
    action: {
      type: String,
      required: true,
      enum: ['discount_override', 'stock_override', 'price_override', 'negative_stock_sale'],
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
    bill: {
      type: Schema.Types.ObjectId,
      ref: 'Bill',
    },
    invoiceNumber: String,
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: String,
    originalValue: Number,
    overrideValue: Number,
    discountAmount: Number,
    reason: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ['approved', 'rejected', 'locked'],
      required: true,
    },
    approverIdentity: {
      type: String,
      default: 'admin_pin',
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    ip: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

overrideLogSchema.index({ agent: 1, createdAt: -1 });
overrideLogSchema.index({ action: 1, createdAt: -1 });
overrideLogSchema.index({ result: 1, createdAt: -1 });
overrideLogSchema.index({ createdAt: -1 });

export const OverrideLog: Model<IOverrideLog> = mongoose.model<IOverrideLog>('OverrideLog', overrideLogSchema);
