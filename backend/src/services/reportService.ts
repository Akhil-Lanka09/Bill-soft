import { Bill, Product, Customer, DailyClosing, Expense, CreditNote } from '../models';
import { Types } from 'mongoose';
import { Money } from '../utils/money';
import { FinancialYear } from '../utils/financialYear';

export class ReportService {
  /**
   * Executive Dashboard Overview
   */
  static async getDashboardSummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      todayBills,
      monthBills,
      lowStockProducts,
      outOfStockProducts,
      totalCustomers,
      customersWithCredit,
      recentBills,
    ] = await Promise.all([
      Bill.find({ billDate: { $gte: todayStart }, status: 'active' }).lean(),
      Bill.find({ billDate: { $gte: monthStart }, status: 'active' }).lean(),
      Product.countDocuments({
        isActive: true,
        isArchived: false,
        $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lt: ['$currentStock', { $ifNull: ['$lowStockThreshold', 15] }] }] },
      }),
      Product.countDocuments({ isActive: true, isArchived: false, currentStock: { $lte: 0 } }),
      Customer.countDocuments({ isActive: true }),
      Customer.aggregate([
        { $match: { currentBalance: { $gt: 0 } } },
        { $group: { _id: null, totalOutstanding: { $sum: '$currentBalance' }, count: { $sum: 1 } } },
      ]),
      Bill.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'name phone')
        .lean(),
    ]);

    const todaySales = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const monthSales = monthBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

    // Payment methods breakdown for today
    const paymentMethods: Record<string, number> = { cash: 0, upi: 0, card: 0, credit: 0, bank_transfer: 0 };
    for (const b of todayBills) {
      for (const p of b.payments || []) {
        paymentMethods[p.method] = (paymentMethods[p.method] || 0) + (p.amount || 0);
      }
    }

    return {
      today: {
        sales: todaySales,
        billsCount: todayBills.length,
        paymentBreakdown: paymentMethods,
      },
      month: {
        sales: monthSales,
        billsCount: monthBills.length,
      },
      inventory: {
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStockProducts,
      },
      customers: {
        total: totalCustomers,
        totalOutstanding: customersWithCredit[0]?.totalOutstanding || 0,
        countWithDebt: customersWithCredit[0]?.count || 0,
      },
      recentBills,
    };
  }

  /**
   * Detailed Sales Report with Trends and Analytics
   */
  static async getSalesReport(startDate?: string, endDate?: string) {
    const query: any = { status: 'active' };

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const bills = await Bill.find(query).sort({ billDate: 1 }).lean();

    let totalGrossSales = Money.from(0);
    let totalDiscount = Money.from(0);
    let totalTaxable = Money.from(0);
    let totalTax = Money.from(0);
    let totalNetSales = Money.from(0);

    const paymentTotals: Record<string, number> = { cash: 0, upi: 0, card: 0, credit: 0, bank_transfer: 0 };
    const dateGrouping: Record<string, { date: string; sales: number; count: number; tax: number }> = {};

    for (const b of bills) {
      totalGrossSales = Money.add(totalGrossSales, b.subtotal || 0);
      totalDiscount = Money.add(totalDiscount, b.billDiscountAmount || 0);
      totalTaxable = Money.add(totalTaxable, b.taxableAmount || 0);
      totalTax = Money.add(totalTax, b.totalTax || 0);
      totalNetSales = Money.add(totalNetSales, b.grandTotal || 0);

      for (const p of b.payments || []) {
        paymentTotals[p.method] = (paymentTotals[p.method] || 0) + (p.amount || 0);
      }

      const dateKey = new Date(b.billDate).toISOString().split('T')[0];
      if (!dateGrouping[dateKey]) {
        dateGrouping[dateKey] = { date: dateKey, sales: 0, count: 0, tax: 0 };
      }
      dateGrouping[dateKey].sales += b.grandTotal || 0;
      dateGrouping[dateKey].count += 1;
      dateGrouping[dateKey].tax += b.totalTax || 0;
    }

    return {
      summary: {
        totalBills: bills.length,
        grossSales: Money.toNumber(Money.round2(totalGrossSales)),
        totalDiscount: Money.toNumber(Money.round2(totalDiscount)),
        taxableAmount: Money.toNumber(Money.round2(totalTaxable)),
        taxAmount: Money.toNumber(Money.round2(totalTax)),
        netSales: Money.toNumber(Money.round2(totalNetSales)),
        paymentTotals,
      },
      dailyTrends: Object.values(dateGrouping),
    };
  }

  /**
   * GST GSTR-1 Sales Report (B2B, B2C, HSN Summary)
   */
  static async getGSTR1Report(startDate: string, endDate: string) {
    const query: any = {
      status: 'active',
      billDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const bills = await Bill.find(query).lean();

    const b2bInvoices: any[] = [];
    const b2cInvoices: any[] = [];
    const hsnMap: Record<string, { hsn: string; description: string; quantity: number; totalValue: number; taxableValue: number; cgst: number; sgst: number; igst: number }> = {};

    for (const b of bills) {
      const invoiceData = {
        invoiceNumber: b.invoiceNumber,
        billDate: b.billDate,
        customerName: b.customerName || 'Walk-in Customer',
        gstin: b.customerGstin,
        state: b.customerState || 'Andhra Pradesh',
        taxableAmount: b.taxableAmount,
        cgst: b.totalCgst,
        sgst: b.totalSgst,
        igst: b.totalIgst,
        totalTax: b.totalTax,
        grandTotal: b.grandTotal,
      };

      if (b.customerGstin && b.customerGstin.trim().length === 15) {
        b2bInvoices.push(invoiceData);
      } else {
        b2cInvoices.push(invoiceData);
      }

      // Aggregate by HSN
      for (const item of b.items) {
        const hsn = item.hsn || '0602';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn,
            description: item.productName,
            quantity: 0,
            totalValue: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
          };
        }
        hsnMap[hsn].quantity += item.quantity;
        hsnMap[hsn].totalValue += item.lineTotal;
        hsnMap[hsn].taxableValue += item.taxableAmount;
        hsnMap[hsn].cgst += item.cgst || 0;
        hsnMap[hsn].sgst += item.sgst || 0;
        hsnMap[hsn].igst += item.igst || 0;
      }
    }

    return {
      financialYear: FinancialYear.getFinancialYear(new Date(startDate)),
      period: { startDate, endDate },
      b2bCount: b2bInvoices.length,
      b2cCount: b2cInvoices.length,
      b2bInvoices,
      b2cInvoices,
      hsnSummary: Object.values(hsnMap),
    };
  }

  /**
   * Inventory Valuation Report (Cost vs Retail Value)
   */
  static async getInventoryValuation() {
    const products = await Product.find({ isActive: true, isArchived: false }).populate('category', 'name').lean();

    let totalCostValuation = Money.from(0);
    let totalSellingValuation = Money.from(0);
    let totalStockUnits = 0;

    const items = products.map((p) => {
      const stock = Math.max(0, p.currentStock || 0);
      const costVal = Money.multiply(p.costPrice || 0, stock);
      const sellVal = Money.multiply(p.sellingPrice || 0, stock);

      totalStockUnits += stock;
      totalCostValuation = Money.add(totalCostValuation, costVal);
      totalSellingValuation = Money.add(totalSellingValuation, sellVal);

      return {
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: (p.category as any)?.name || 'General',
        currentStock: stock,
        unit: p.unit,
        costPrice: p.costPrice || 0,
        sellingPrice: p.sellingPrice || 0,
        costValuation: Money.toNumber(Money.round2(costVal)),
        sellingValuation: Money.toNumber(Money.round2(sellVal)),
        potentialProfit: Money.toNumber(Money.round2(Money.subtract(sellVal, costVal))),
      };
    });

    const potentialProfit = Money.subtract(totalSellingValuation, totalCostValuation);

    return {
      summary: {
        totalProducts: products.length,
        totalStockUnits,
        totalCostValuation: Money.toNumber(Money.round2(totalCostValuation)),
        totalSellingValuation: Money.toNumber(Money.round2(totalSellingValuation)),
        potentialProfit: Money.toNumber(Money.round2(potentialProfit)),
      },
      items,
    };
  }

  /**
   * Daily Counter Closing Summary (Day-End Cash Reconciliation)
   */
  static async getDailyClosingData(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [bills, expenses, returns] = await Promise.all([
      Bill.find({ billDate: { $gte: startOfDay, $lte: endOfDay }, status: 'active' }).lean(),
      Expense.find({ date: { $gte: startOfDay, $lte: endOfDay } }).lean(),
      CreditNote.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).lean(),
    ]);

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let bankSales = 0;
    let creditSales = 0;
    let totalItems = 0;

    for (const b of bills) {
      totalItems += b.items.reduce((acc, it) => acc + it.quantity, 0);
      for (const p of b.payments || []) {
        if (p.method === 'cash') cashSales += p.amount;
        else if (p.method === 'upi') upiSales += p.amount;
        else if (p.method === 'card') cardSales += p.amount;
        else if (p.method === 'bank_transfer') bankSales += p.amount;
        else if (p.method === 'credit') creditSales += p.amount;
      }
    }

    const totalExpenseAmount = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const totalReturnAmount = returns.reduce((acc, ret) => acc + (ret.grandTotal || 0), 0);
    const expectedCashInDrawer = cashSales - totalExpenseAmount;

    return {
      date: targetDate,
      totalBills: bills.length,
      totalItems,
      cashSales,
      upiSales,
      cardSales,
      bankSales,
      creditSales,
      totalSales: cashSales + upiSales + cardSales + bankSales + creditSales,
      expenses: totalExpenseAmount,
      returns: totalReturnAmount,
      expectedCash: Math.max(0, expectedCashInDrawer),
    };
  }

  /**
   * Save Daily Closing
   */
  static async submitDailyClosing(data: any, userId: string, userName: string) {
    const fy = FinancialYear.getFinancialYear(new Date(data.date));
    const closing = new DailyClosing({
      ...data,
      financialYear: fy,
      closedBy: new Types.ObjectId(userId),
      closedByName: userName,
    });
    await closing.save();
    return closing;
  }
}
