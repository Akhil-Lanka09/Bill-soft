import { Customer, ICustomer, Bill, CustomerPayment, ICustomerPayment, AuditLog } from '../models';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';
import { Money } from '../utils/money';

export interface CustomerQueryOptions {
  search?: string;
  hasOutstanding?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomerService {
  /**
   * Create a new customer
   */
  static async createCustomer(data: Partial<ICustomer>, userId: string, userName: string): Promise<ICustomer> {
    const existing = await Customer.findOne({ phone: data.phone });
    if (existing) {
      throw ApiError.conflict(`Customer with phone number ${data.phone} already exists`);
    }

    const customer = new Customer({
      ...data,
      currentBalance: data.openingBalance || 0,
      totalPurchases: 0,
      totalPayments: 0,
    });

    await customer.save();

    await AuditLog.create({
      action: 'CUSTOMER_CREATED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Customer',
      targetId: customer._id,
      metadata: { name: customer.name, phone: customer.phone },
    });

    return customer;
  }

  /**
   * Update existing customer
   */
  static async updateCustomer(id: string, data: Partial<ICustomer>, userId: string, userName: string): Promise<ICustomer> {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    if (data.phone && data.phone !== customer.phone) {
      const existing = await Customer.findOne({ phone: data.phone, _id: { $ne: customer._id } });
      if (existing) {
        throw ApiError.conflict(`Phone number ${data.phone} is already registered to another customer`);
      }
    }

    Object.assign(customer, data);
    await customer.save();

    await AuditLog.create({
      action: 'CUSTOMER_UPDATED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Customer',
      targetId: customer._id,
      metadata: { name: customer.name, phone: customer.phone },
    });

    return customer;
  }

  /**
   * Get single customer by ID
   */
  static async getCustomerById(id: string): Promise<ICustomer> {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
    return customer;
  }

  /**
   * List customers with search, pagination, and balance filtering
   */
  static async getCustomers(options: CustomerQueryOptions) {
    const {
      search,
      hasOutstanding,
      isActive = true,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    const query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (hasOutstanding) {
      query.currentBalance = { $gt: 0 };
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { gstin: searchRegex },
        { city: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [customers, total] = await Promise.all([
      Customer.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Customer.countDocuments(query),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Record payment from customer towards outstanding balance
   */
  static async recordPayment(
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer',
    receivedBy: string,
    receivedByName: string,
    referenceId?: string,
    billId?: string,
    notes?: string
  ): Promise<ICustomerPayment> {
    if (amount <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than 0');
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    const payment = await CustomerPayment.create({
      customer: customer._id,
      customerName: customer.name,
      amount,
      paymentMethod,
      referenceId,
      bill: billId ? new Types.ObjectId(billId) : undefined,
      notes,
      receivedBy: new Types.ObjectId(receivedBy),
      receivedByName,
    });

    // Update customer current balance and total payments
    const newBal = Money.subtract(customer.currentBalance, amount);
    customer.currentBalance = Money.toNumber(newBal);
    customer.totalPayments = Money.toNumber(Money.add(customer.totalPayments, amount));
    await customer.save();

    await AuditLog.create({
      action: 'PAYMENT_RECORDED',
      user: new Types.ObjectId(receivedBy),
      userName: receivedByName,
      targetModel: 'CustomerPayment',
      targetId: payment._id,
      metadata: {
        customer: customer.name,
        amount,
        paymentMethod,
        remainingBalance: customer.currentBalance,
      },
    });

    return payment;
  }

  /**
   * Generate complete ledger statement (Bills debit + Payments credit with running balance)
   */
  static async getCustomerLedger(customerId: string, fromDate?: string, toDate?: string) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    const dateFilter: any = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);

    const billQuery: any = { customer: customer._id, status: { $ne: 'cancelled' } };
    const paymentQuery: any = { customer: customer._id };

    if (fromDate || toDate) {
      billQuery.billDate = dateFilter;
      paymentQuery.createdAt = dateFilter;
    }

    const [bills, payments] = await Promise.all([
      Bill.find(billQuery).sort({ billDate: 1 }).lean(),
      CustomerPayment.find(paymentQuery).sort({ createdAt: 1 }).lean(),
    ]);

    // Merge transactions chronologically
    const transactions: any[] = [];

    // Opening balance entry
    transactions.push({
      date: customer.createdAt,
      type: 'OPENING_BALANCE',
      reference: 'OB',
      debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
      credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
      description: 'Opening Balance',
    });

    for (const b of bills) {
      transactions.push({
        date: b.billDate,
        type: 'INVOICE',
        reference: b.invoiceNumber,
        debit: b.grandTotal,
        credit: 0,
        description: `Sale Invoice #${b.invoiceNumber} (${b.paymentStatus})`,
        billId: b._id,
      });

      // If initial payment was made at checkout, record the credit too
      if (b.totalPaid > 0) {
        transactions.push({
          date: b.billDate,
          type: 'PAYMENT',
          reference: `PAY-${b.invoiceNumber}`,
          debit: 0,
          credit: b.totalPaid,
          description: `Payment at billing #${b.invoiceNumber}`,
          billId: b._id,
        });
      }
    }

    for (const p of payments) {
      transactions.push({
        date: p.createdAt,
        type: 'RECEIPT',
        reference: p.referenceId || `RCP-${p._id.toString().slice(-6)}`,
        debit: 0,
        credit: p.amount,
        description: `Ledger Payment via ${p.paymentMethod.toUpperCase()}${p.notes ? ' - ' + p.notes : ''}`,
      });
    }

    // Sort all chronologically
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = Money.from(0);
    const ledgerEntries = transactions.map((tx) => {
      runningBalance = Money.add(runningBalance, tx.debit);
      runningBalance = Money.subtract(runningBalance, tx.credit);

      return {
        ...tx,
        runningBalance: Money.toNumber(Money.round2(runningBalance)),
      };
    });

    return {
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        gstin: customer.gstin,
        currentBalance: customer.currentBalance,
        creditLimit: customer.creditLimit,
        creditDays: customer.creditDays,
      },
      summary: {
        totalDebits: Money.toNumber(Money.round2(Money.sum(transactions.map((t) => t.debit)))),
        totalCredits: Money.toNumber(Money.round2(Money.sum(transactions.map((t) => t.credit)))),
        currentBalance: customer.currentBalance,
      },
      entries: ledgerEntries,
    };
  }
}
