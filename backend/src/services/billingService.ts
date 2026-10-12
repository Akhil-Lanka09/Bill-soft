import mongoose, { Types } from 'mongoose';
import { Bill, IBill, IBillItem, IPaymentDetail, Product, Customer, StockLedger, AuditLog, HeldBill, CreditNote, InvoiceCounter, Settings, OverrideLog } from '../models';
import { ApiError } from '../utils/ApiError';
import { Money } from '../utils/money';
import { FinancialYear } from '../utils/financialYear';
import config from '../config';

export interface CreateBillItemInput {
  productId: string;
  quantity: number;
  rate?: number; // Override price or custom rate
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  overrideApplied?: boolean;
  overrideReason?: string;
  overrideApprovedBy?: string;
}

export interface CreatePaymentInput {
  method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit';
  amount: number;
  referenceId?: string;
  receivedAmount?: number;
  changeAmount?: number;
}

export interface CreateBillInput {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerState?: string;
  billType?: 'tax_invoice' | 'bill_of_supply';
  items: CreateBillItemInput[];
  billDiscountType?: 'percentage' | 'fixed';
  billDiscountValue?: number;
  payments: CreatePaymentInput[];
  notes?: string;
  idempotencyKey: string;
  agentId: string;
  agentName: string;
}

export interface BillQueryOptions {
  search?: string;
  startDate?: string;
  endDate?: string;
  agentId?: string;
  customerId?: string;
  paymentStatus?: string;
  status?: string;
  billType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class BillingService {
  /**
   * Get next sequential invoice number atomically
   */
  static async getNextInvoiceNumber(financialYear: string, billType: 'tax_invoice' | 'bill_of_supply' = 'tax_invoice'): Promise<{ invoiceNumber: string; sequenceNumber: number }> {
    const settings = await Settings.findOne();
    const prefix = billType === 'tax_invoice' 
      ? (settings?.invoicePrefix || config.invoice.prefix || 'BNN')
      : 'BOS';

    const counter = await InvoiceCounter.findOneAndUpdate(
      { financialYear, prefix },
      { $inc: { currentSequence: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const padding = (settings as any)?.invoicePadding || config.invoice.padding || 5;
    const seqStr = String(counter.currentSequence).padStart(padding, '0');
    const invoiceNumber = `${prefix}/${financialYear}/${seqStr}`;

    return {
      invoiceNumber,
      sequenceNumber: counter.currentSequence,
    };
  }

  /**
   * Validate cart items and compute all financial calculations with Decimal precision
   */
  static async calculateBillSummary(
    itemsInput: CreateBillItemInput[],
    billDiscountType: 'percentage' | 'fixed' = 'percentage',
    billDiscountValue: number = 0,
    customerState: string = 'Andhra Pradesh'
  ) {
    if (!itemsInput || itemsInput.length === 0) {
      throw ApiError.badRequest('Cart cannot be empty');
    }

    const businessState = config.business.address.state || 'Andhra Pradesh';
    const isInterState = customerState && customerState.trim().toLowerCase() !== businessState.trim().toLowerCase();

    const evaluatedItems: IBillItem[] = [];
    let itemsSubtotal = Money.from(0);
    let itemsTaxableTotal = Money.from(0);
    let totalCgst = Money.from(0);
    let totalSgst = Money.from(0);
    let totalIgst = Money.from(0);

    for (const item of itemsInput) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw ApiError.notFound(`Product not found: ${item.productId}`);
      }
      if (!product.isActive || product.isArchived) {
        throw ApiError.badRequest(`Product "${product.name}" is not active or has been archived`);
      }

      if (item.quantity <= 0) {
        throw ApiError.badRequest(`Invalid quantity for product "${product.name}": must be > 0`);
      }

      // Check stock
      if (product.currentStock < item.quantity && !item.overrideApplied) {
        throw ApiError.badRequest(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}. Manager override required.`
        );
      }

      // Determine selling rate
      const effectiveRate = item.rate !== undefined && item.rate >= 0 ? item.rate : (product.sellingPrice || 0);
      const rateDecimal = Money.from(effectiveRate);
      const qtyDecimal = Money.from(item.quantity);

      // Line item gross
      const grossAmount = Money.multiply(rateDecimal, qtyDecimal);

      // Item discount
      let discountAmount = Money.from(0);
      if (item.discountType === 'percentage' && item.discountValue) {
        discountAmount = Money.percentage(grossAmount, item.discountValue);
      } else if (item.discountType === 'fixed' && item.discountValue) {
        discountAmount = Money.from(item.discountValue);
      }
      if (discountAmount.greaterThan(grossAmount)) {
        discountAmount = grossAmount;
      }

      const netLine = Money.subtract(grossAmount, discountAmount);
      const gstRate = product.gstRate || 0;

      // Tax calculations: price is tax-inclusive or tax-exclusive? In our nursery POS, rates are exclusive of GST by default
      let taxableAmount: any;
      let cgst = Money.from(0);
      let sgst = Money.from(0);
      let igst = Money.from(0);
      let itemTax = Money.from(0);

      if (gstRate > 0) {
        const gstResult = isInterState
          ? Money.calculateIGSTExclusive(netLine, gstRate)
          : Money.calculateGSTExclusive(netLine, gstRate);

        taxableAmount = gstResult.taxableAmount;
        cgst = gstResult.cgst;
        sgst = gstResult.sgst;
        igst = gstResult.igst;
        itemTax = gstResult.totalTax;
      } else {
        taxableAmount = Money.round2(netLine);
      }

      const lineTotal = Money.round2(Money.add(taxableAmount, itemTax));

      itemsSubtotal = Money.add(itemsSubtotal, grossAmount);
      itemsTaxableTotal = Money.add(itemsTaxableTotal, taxableAmount);
      totalCgst = Money.add(totalCgst, cgst);
      totalSgst = Money.add(totalSgst, sgst);
      totalIgst = Money.add(totalIgst, igst);

      evaluatedItems.push({
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        hsn: product.hsn || '0602',
        quantity: item.quantity,
        rate: Money.toNumber(rateDecimal),
        discountType: item.discountType,
        discountValue: item.discountValue || 0,
        discountAmount: Money.toNumber(Money.round2(discountAmount)),
        taxableAmount: Money.toNumber(taxableAmount),
        gstRate,
        cgst: Money.toNumber(cgst),
        sgst: Money.toNumber(sgst),
        igst: Money.toNumber(igst),
        totalTax: Money.toNumber(itemTax),
        lineTotal: Money.toNumber(lineTotal),
        stockBefore: product.currentStock,
        stockAfter: product.currentStock - item.quantity,
        overrideApplied: !!item.overrideApplied,
        overrideReason: item.overrideReason,
      });
    }

    // Bill-level discount
    let billDiscountAmount = Money.from(0);
    if (billDiscountType === 'percentage' && billDiscountValue > 0) {
      billDiscountAmount = Money.percentage(itemsTaxableTotal, billDiscountValue);
    } else if (billDiscountType === 'fixed' && billDiscountValue > 0) {
      billDiscountAmount = Money.from(billDiscountValue);
    }
    if (billDiscountAmount.greaterThan(itemsTaxableTotal)) {
      billDiscountAmount = itemsTaxableTotal;
    }

    const finalTaxable = Money.subtract(itemsTaxableTotal, billDiscountAmount);
    const totalTax = Money.add(totalCgst, Money.add(totalSgst, totalIgst));
    const preRoundTotal = Money.add(finalTaxable, totalTax);
    const { roundOff, grandTotal } = Money.calculateRoundOff(preRoundTotal);

    return {
      evaluatedItems,
      isInterState,
      subtotal: Money.toNumber(Money.round2(itemsSubtotal)),
      billDiscountAmount: Money.toNumber(Money.round2(billDiscountAmount)),
      taxableAmount: Money.toNumber(Money.round2(finalTaxable)),
      totalCgst: Money.toNumber(Money.round2(totalCgst)),
      totalSgst: Money.toNumber(Money.round2(totalSgst)),
      totalIgst: Money.toNumber(Money.round2(totalIgst)),
      totalTax: Money.toNumber(Money.round2(totalTax)),
      preRoundTotal: Money.toNumber(preRoundTotal),
      roundOff: Money.toNumber(roundOff),
      grandTotal: Money.toNumber(grandTotal),
      amountInWords: Money.toWords(Money.toNumber(grandTotal)),
    };
  }

  /**
   * Create a new Bill (Checkout)
   */
  static async createBill(input: CreateBillInput, ip: string, userAgent: string): Promise<IBill> {
    // 1. Check idempotency
    if (input.idempotencyKey) {
      const existingBill = await Bill.findOne({ idempotencyKey: input.idempotencyKey });
      if (existingBill) {
        return existingBill;
      }
    }

    // 2. Fetch customer details if provided
    let customerDoc = null;
    let customerState = input.customerState || 'Andhra Pradesh';
    if (input.customerId) {
      customerDoc = await Customer.findById(input.customerId);
      if (customerDoc) {
        customerState = customerDoc.state || customerState;
      }
    }

    // 3. Compute calculations
    const summary = await BillingService.calculateBillSummary(
      input.items,
      input.billDiscountType,
      input.billDiscountValue,
      customerState
    );

    // 4. Validate payment
    let totalPaid = Money.from(0);
    const paymentRecords: IPaymentDetail[] = [];
    let hasCreditPayment = false;

    for (const p of input.payments) {
      if (p.amount < 0) {
        throw ApiError.badRequest('Payment amount cannot be negative');
      }
      totalPaid = Money.add(totalPaid, p.amount);
      if (p.method === 'credit') {
        hasCreditPayment = true;
      }
      paymentRecords.push({
        method: p.method,
        amount: p.amount,
        referenceId: p.referenceId,
        receivedAmount: p.receivedAmount,
        changeAmount: p.changeAmount,
        timestamp: new Date(),
        status: 'completed',
      });
    }

    const grandTotalDec = Money.from(summary.grandTotal);
    const balanceDue = Money.toNumber(Money.round2(Money.subtract(grandTotalDec, totalPaid)));

    let paymentStatus: 'paid' | 'partial' | 'credit' | 'pending' = 'pending';
    if (Money.toNumber(totalPaid) >= summary.grandTotal) {
      paymentStatus = 'paid';
    } else if (hasCreditPayment || balanceDue > 0) {
      if (totalPaid.isZero()) {
        paymentStatus = 'credit';
      } else {
        paymentStatus = 'partial';
      }
    }

    // If credit or balance due, a customer profile MUST be provided
    if (balanceDue > 0 && !customerDoc && !input.customerId) {
      throw ApiError.badRequest('Customer details required for credit or partial payment');
    }

    // Check customer credit limit if applicable
    if (customerDoc && balanceDue > 0 && customerDoc.creditLimit > 0) {
      if (customerDoc.currentBalance + balanceDue > customerDoc.creditLimit) {
        throw ApiError.badRequest(
          `Customer credit limit exceeded! Available credit: ${Math.max(0, customerDoc.creditLimit - customerDoc.currentBalance)}, Due: ${balanceDue}`
        );
      }
    }

    // 5. Generate sequential invoice number
    const fy = FinancialYear.getFinancialYear();
    const billType = input.billType || 'tax_invoice';
    const { invoiceNumber, sequenceNumber } = await BillingService.getNextInvoiceNumber(fy, billType);

    // 6. Update product stock atomically and log stock ledger
    let overrideUsed = false;
    for (const item of summary.evaluatedItems) {
      if (item.overrideApplied) overrideUsed = true;

      const product = await Product.findById(item.product);
      if (!product) continue;

      const stockBefore = product.currentStock;
      const stockAfter = stockBefore - item.quantity;

      // Update product currentStock
      product.currentStock = stockAfter;
      await product.save();

      // Create StockLedger
      await StockLedger.create({
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        movementType: 'sale',
        quantity: -item.quantity,
        stockBefore,
        stockAfter,
        reference: invoiceNumber,
        referenceType: 'bill',
        reason: `Sale via Bill #${invoiceNumber}`,
        user: new Types.ObjectId(input.agentId),
        userName: input.agentName,
      });

      // If price override was applied, create OverrideLog
      if (item.overrideApplied) {
        await OverrideLog.create({
          action: 'PRICE_OVERRIDE',
          item: product.name,
          originalValue: product.sellingPrice,
          newValue: item.rate,
          reason: item.overrideReason || 'Agent manual price override',
          authorizedBy: new Types.ObjectId(input.agentId),
          authorizedByName: input.agentName,
          billId: invoiceNumber,
        });
      }
    }

    // 7. Update customer ledger / balance
    if (customerDoc) {
      customerDoc.totalPurchases = (customerDoc.totalPurchases || 0) + summary.grandTotal;
      customerDoc.totalPayments = (customerDoc.totalPayments || 0) + Money.toNumber(totalPaid);
      if (balanceDue > 0) {
        customerDoc.currentBalance = (customerDoc.currentBalance || 0) + balanceDue;
      }
      await customerDoc.save();
    }

    // 8. Create Bill
    const newBill = new Bill({
      invoiceNumber,
      financialYear: fy,
      sequenceNumber,
      billDate: new Date(),
      billType,
      agent: new Types.ObjectId(input.agentId),
      agentName: input.agentName,
      customer: customerDoc ? customerDoc._id : undefined,
      customerName: customerDoc ? customerDoc.name : input.customerName,
      customerPhone: customerDoc ? customerDoc.phone : input.customerPhone,
      customerGstin: customerDoc ? customerDoc.gstin : input.customerGstin,
      customerState,
      isInterState: summary.isInterState,
      items: summary.evaluatedItems,
      subtotal: summary.subtotal,
      discountType: input.billDiscountType,
      discountValue: input.billDiscountValue || 0,
      billDiscountAmount: summary.billDiscountAmount,
      taxableAmount: summary.taxableAmount,
      totalCgst: summary.totalCgst,
      totalSgst: summary.totalSgst,
      totalIgst: summary.totalIgst,
      totalTax: summary.totalTax,
      preRoundTotal: summary.preRoundTotal,
      roundOff: summary.roundOff,
      grandTotal: summary.grandTotal,
      amountInWords: summary.amountInWords,
      payments: paymentRecords,
      paymentStatus,
      totalPaid: Money.toNumber(totalPaid),
      balanceDue,
      status: 'active',
      notes: input.notes,
      idempotencyKey: input.idempotencyKey,
      overrideUsed,
    });

    await newBill.save();

    // 9. Audit log
    await AuditLog.create({
      action: 'BILL_CREATED',
      user: new Types.ObjectId(input.agentId),
      userName: input.agentName,
      targetModel: 'Bill',
      targetId: newBill._id,
      ip,
      userAgent,
      metadata: {
        invoiceNumber,
        grandTotal: summary.grandTotal,
        paymentStatus,
        itemCount: summary.evaluatedItems.length,
      },
    });

    return newBill;
  }

  /**
   * Search / query bills with pagination
   */
  static async getBills(options: BillQueryOptions) {
    const {
      search,
      startDate,
      endDate,
      agentId,
      customerId,
      paymentStatus,
      status,
      billType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
      ];
    }

    const validStartDate = startDate && startDate !== 'undefined' ? startDate : undefined;
    const validEndDate = endDate && endDate !== 'undefined' ? endDate : undefined;
    if (validStartDate || validEndDate) {
      query.billDate = {};
      if (validStartDate) query.billDate.$gte = new Date(validStartDate.includes('T') ? validStartDate : `${validStartDate}T00:00:00.000Z`);
      if (validEndDate) query.billDate.$lte = new Date(validEndDate.includes('T') ? validEndDate : `${validEndDate}T23:59:59.999Z`);
    }

    if (agentId) query.agent = new Types.ObjectId(agentId);
    if (customerId) query.customer = new Types.ObjectId(customerId);
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (status) query.status = status;
    if (billType) query.billType = billType;

    const skip = (page - 1) * limit;
    const sortOption: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate('agent', 'name username role')
        .populate('customer', 'name phone currentBalance')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Bill.countDocuments(query),
    ]);

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single bill by ID
   */
  static async getBillById(id: string): Promise<IBill> {
    const bill = await Bill.findById(id)
      .populate('agent', 'name username role')
      .populate('customer', 'name phone address gstin currentBalance creditLimit')
      .populate('cancelledBy', 'name username');

    if (!bill) {
      throw ApiError.notFound('Bill not found');
    }
    return bill;
  }

  /**
   * Get bill by invoice number
   */
  static async getBillByInvoiceNumber(invoiceNumber: string): Promise<IBill> {
    const bill = await Bill.findOne({ invoiceNumber })
      .populate('agent', 'name username role')
      .populate('customer', 'name phone address gstin currentBalance creditLimit');

    if (!bill) {
      throw ApiError.notFound(`Bill ${invoiceNumber} not found`);
    }
    return bill;
  }

  /**
   * Cancel/Void a Bill (Manager or Admin permission)
   */
  static async cancelBill(
    billId: string,
    reason: string,
    userId: string,
    userName: string,
    ip: string,
    userAgent: string
  ): Promise<IBill> {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw ApiError.notFound('Bill not found');
    }

    if (bill.status === 'cancelled') {
      throw ApiError.badRequest('Bill is already cancelled');
    }

    // 1. Restore product inventory
    for (const item of bill.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + item.quantity;
        product.currentStock = stockAfter;
        await product.save();

        await StockLedger.create({
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          movementType: 'return',
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          reference: bill.invoiceNumber,
          referenceType: 'bill',
          reason: `Stock restored on Bill #${bill.invoiceNumber} cancellation. Reason: ${reason}`,
          user: new Types.ObjectId(userId),
          userName,
        });
      }
    }

    // 2. Adjust customer ledger if customer is attached
    if (bill.customer) {
      const customer = await Customer.findById(bill.customer);
      if (customer) {
        customer.totalPurchases = Math.max(0, (customer.totalPurchases || 0) - bill.grandTotal);
        customer.totalPayments = Math.max(0, (customer.totalPayments || 0) - bill.totalPaid);
        if (bill.balanceDue > 0) {
          customer.currentBalance = Math.max(0, (customer.currentBalance || 0) - bill.balanceDue);
        }
        await customer.save();
      }
    }

    // 3. Update Bill status
    bill.status = 'cancelled';
    bill.cancelReason = reason;
    bill.cancelledBy = new Types.ObjectId(userId);
    bill.cancelledAt = new Date();
    await bill.save();

    // 4. Audit Log
    await AuditLog.create({
      action: 'BILL_CANCELLED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Bill',
      targetId: bill._id,
      ip,
      userAgent,
      reason,
      metadata: { invoiceNumber: bill.invoiceNumber, grandTotal: bill.grandTotal },
    });

    return bill;
  }

  /**
   * Process Partial or Full Return / Issue Credit Note
   */
  static async processReturn(
    billId: string,
    returnedItems: { productId: string; quantity: number }[],
    reason: string,
    userId: string,
    userName: string
  ): Promise<any> {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw ApiError.notFound('Bill not found');
    }
    if (bill.status === 'cancelled') {
      throw ApiError.badRequest('Cannot return items from a cancelled bill');
    }

    let returnSubtotal = Money.from(0);
    let returnTotalTax = Money.from(0);
    let returnGrandTotal = Money.from(0);

    const creditNoteItems: any[] = [];

    for (const ret of returnedItems) {
      const billItem = bill.items.find(
        (bi) => bi.product.toString() === ret.productId
      );
      if (!billItem) {
        throw ApiError.badRequest(`Product not found in this bill`);
      }
      if (ret.quantity <= 0 || ret.quantity > billItem.quantity) {
        throw ApiError.badRequest(
          `Invalid return quantity for ${billItem.productName}. Maximum: ${billItem.quantity}`
        );
      }

      // Calculate unit taxable and tax for the returned item
      const unitRate = Money.from(billItem.rate);
      const unitQty = Money.from(ret.quantity);
      const lineTaxable = Money.multiply(unitRate, unitQty);

      const gstRate = billItem.gstRate || 0;
      let cgst = Money.from(0);
      let sgst = Money.from(0);
      let igst = Money.from(0);
      let totalTax = Money.from(0);

      if (gstRate > 0) {
        if (bill.isInterState) {
          const res = Money.calculateIGSTExclusive(lineTaxable, gstRate);
          igst = res.igst;
          totalTax = res.totalTax;
        } else {
          const res = Money.calculateGSTExclusive(lineTaxable, gstRate);
          cgst = res.cgst;
          sgst = res.sgst;
          totalTax = res.totalTax;
        }
      }

      const lineTotal = Money.round2(Money.add(lineTaxable, totalTax));

      returnSubtotal = Money.add(returnSubtotal, lineTaxable);
      returnTotalTax = Money.add(returnTotalTax, totalTax);
      returnGrandTotal = Money.add(returnGrandTotal, lineTotal);

      // Restore stock
      const product = await Product.findById(billItem.product);
      if (product) {
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + ret.quantity;
        product.currentStock = stockAfter;
        await product.save();

        await StockLedger.create({
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          movementType: 'return',
          quantity: ret.quantity,
          stockBefore,
          stockAfter,
          reference: bill.invoiceNumber,
          referenceType: 'bill',
          reason: `Return against bill #${bill.invoiceNumber}: ${reason}`,
          user: new Types.ObjectId(userId),
          userName,
        });
      }

      creditNoteItems.push({
        product: billItem.product,
        productName: billItem.productName,
        quantity: ret.quantity,
        rate: billItem.rate,
        taxableAmount: Money.toNumber(Money.round2(lineTaxable)),
        gstRate,
        cgst: Money.toNumber(cgst),
        sgst: Money.toNumber(sgst),
        igst: Money.toNumber(igst),
        totalTax: Money.toNumber(totalTax),
        lineTotal: Money.toNumber(lineTotal),
      });
    }

    const cnCount = await CreditNote.countDocuments();
    const creditNoteNumber = `CN/${FinancialYear.getFinancialYear()}/${String(cnCount + 1).padStart(4, '0')}`;

    const creditNote = await CreditNote.create({
      creditNoteNumber,
      originalBill: bill._id,
      originalInvoiceNumber: bill.invoiceNumber,
      customer: bill.customer,
      customerName: bill.customerName,
      type: returnedItems.length === bill.items.length ? 'full_return' : 'partial_return',
      items: creditNoteItems,
      subtotal: Money.toNumber(Money.round2(returnSubtotal)),
      totalTax: Money.toNumber(Money.round2(returnTotalTax)),
      grandTotal: Money.toNumber(Money.round2(returnGrandTotal)),
      reason,
      stockRestored: true,
      createdBy: new Types.ObjectId(userId),
    });

    // Update bill status
    bill.status = returnedItems.length === bill.items.length ? 'returned' : 'partially_returned';
    await bill.save();

    // Adjust customer balance
    if (bill.customer) {
      const customer = await Customer.findById(bill.customer);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - Money.toNumber(returnGrandTotal));
        await customer.save();
      }
    }

    return creditNote;
  }

  /**
   * Hold Cart (Park Current Bill)
   */
  static async holdBill(
    agentId: string,
    agentName: string,
    items: any[],
    subtotal: number,
    customerId?: string,
    customerName?: string,
    customerPhone?: string,
    notes?: string
  ) {
    const held = await HeldBill.create({
      agent: new Types.ObjectId(agentId),
      agentName,
      customer: customerId ? new Types.ObjectId(customerId) : undefined,
      customerName,
      customerPhone,
      items,
      subtotal,
      notes,
    });
    return held;
  }

  /**
   * Get Held Bills
   */
  static async getHeldBills(agentId?: string) {
    const query: any = {};
    if (agentId) query.agent = new Types.ObjectId(agentId);
    return HeldBill.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Delete / Resume Held Bill
   */
  static async deleteHeldBill(id: string) {
    const held = await HeldBill.findByIdAndDelete(id);
    if (!held) {
      throw ApiError.notFound('Held bill not found');
    }
    return held;
  }

  /**
   * Get formatted receipt thermal print payload
   */
  static async getThermalReceiptData(billId: string) {
    const bill = await BillingService.getBillById(billId);
    const rawSettings = await Settings.findOne();
    const settings: any = rawSettings || {
      businessName: config.business.name,
      address: 'Near NH-16 Bypass, Kadiyam Road, Rajahmundry',
      phone: '+91 98480 22334',
      gstin: '37ABCDE1234F1Z5',
      receiptFooterMessage: 'Thank you for choosing Vijaya Nursery! Visit again.',
    };

    return {
      business: {
        name: settings.businessName || 'VIJAYA NURSERY',
        address: settings.address || 'Near Ring Road, Vijayawada',
        phone: settings.phone || '+91 98765 43210',
        gstin: settings.gstin || '37ABCDE1234F1Z5',
      },
      invoice: {
        invoiceNumber: bill.invoiceNumber,
        date: FinancialYear.formatIST(bill.billDate, 'datetime'),
        billType: bill.billType === 'tax_invoice' ? 'TAX INVOICE' : 'BILL OF SUPPLY',
        agent: bill.agentName,
        customerName: bill.customerName || 'Walk-in Customer',
        customerPhone: bill.customerPhone || '-',
        customerGstin: bill.customerGstin || '-',
      },
      items: bill.items.map((it) => ({
        name: it.productName,
        sku: it.productSku,
        hsn: it.hsn,
        qty: it.quantity,
        rate: it.rate,
        discount: it.discountAmount,
        taxable: it.taxableAmount,
        gstRate: it.gstRate,
        tax: it.totalTax,
        total: it.lineTotal,
      })),
      totals: {
        subtotal: bill.subtotal,
        discount: bill.billDiscountAmount,
        taxable: bill.taxableAmount,
        cgst: bill.totalCgst,
        sgst: bill.totalSgst,
        igst: bill.totalIgst,
        totalTax: bill.totalTax,
        roundOff: bill.roundOff,
        grandTotal: bill.grandTotal,
        amountInWords: bill.amountInWords,
        payments: bill.payments,
        totalPaid: bill.totalPaid,
        balanceDue: bill.balanceDue,
      },
      footer: (settings as any).receiptFooterMessage || 'Thank you for your visit!',
    };
  }
}
