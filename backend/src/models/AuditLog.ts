import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entity?: string;
  entityId?: Types.ObjectId;
  user?: Types.ObjectId;
  userName?: string;
  userRole?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  reason?: string;
  metadata?: any;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT',
        'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_ARCHIVED', 'PRODUCT_RESTORED',
        'PRICE_CHANGED', 'GST_CHANGED', 'STOCK_IN', 'STOCK_ADJUSTED', 'STOCK_TRANSFERRED',
        'BILL_CREATED', 'BILL_CANCELLED', 'BILL_RETURNED',
        'PAYMENT_RECEIVED',
        'DISCOUNT_APPLIED',
        'OVERRIDE_REQUESTED', 'OVERRIDE_APPROVED', 'OVERRIDE_REJECTED', 'OVERRIDE_LOCKED',
        'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_DISABLED', 'USER_ENABLED',
        'SETTINGS_CHANGED', 'SETTINGS_UPDATED', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'OVERRIDE_PIN_CHANGED',
        'CATEGORY_CREATED', 'CATEGORY_UPDATED',
        'CUSTOMER_CREATED', 'CUSTOMER_UPDATED',
        'PURCHASE_CREATED', 'PURCHASE_RECEIVED',
        'EXPENSE_CREATED',
        'DAILY_CLOSING_CREATED',
        'STOCK_RECONCILED',
        'CREDIT_NOTE_CREATED',
        'CUSTOMER_PAYMENT_RECEIVED',
      ],
    },
    entity: String,
    entityId: Schema.Types.ObjectId,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: String,
    userRole: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    reason: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
