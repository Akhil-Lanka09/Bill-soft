export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id?: string;
  _id?: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  isActive?: boolean;
  lastLogin?: string;
}

export interface Category {
  _id: string;
  name: string;
  code: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  localName?: string;
  botanicalName?: string;
  sku: string;
  barcode?: string;
  category: { _id: string; name: string } | string;
  unit: string;
  hsn: string;
  gstRate: number;
  costPrice?: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  location?: string;
  isActive: boolean;
  isArchived?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  rate: number;
  discountType?: 'percentage' | 'fixed';
  discountValue: number;
  overrideApplied?: boolean;
  overrideReason?: string;
}

export interface Customer {
  _id: string;
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
  isActive: boolean;
}

export interface PaymentDetail {
  method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit';
  amount: number;
  referenceId?: string;
  receivedAmount?: number;
  changeAmount?: number;
}

export interface BillItem {
  product: string;
  productName: string;
  teluguName?: string;
  unit?: string;
  productSku: string;
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

export interface Bill {
  _id: string;
  invoiceNumber: string;
  financialYear: string;
  sequenceNumber: number;
  billDate: string;
  billType: 'tax_invoice' | 'bill_of_supply';
  agent: { _id: string; name: string } | string;
  agentName: string;
  customer?: Customer;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerState?: string;
  isInterState: boolean;
  items: BillItem[];
  subtotal: number;
  billDiscountAmount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  payments: PaymentDetail[];
  paymentStatus: 'paid' | 'partial' | 'credit' | 'pending';
  totalPaid: number;
  balanceDue: number;
  status: 'active' | 'cancelled' | 'returned' | 'partially_returned';
  cancelReason?: string;
  notes?: string;
  createdAt: string;
}

export interface BillSummary {
  evaluatedItems: BillItem[];
  isInterState: boolean;
  subtotal: number;
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
}

export interface HeldBill {
  _id: string;
  agentName: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  items: any[];
  notes?: string;
  createdAt: string;
}
