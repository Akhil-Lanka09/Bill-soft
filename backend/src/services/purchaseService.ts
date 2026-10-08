import { Purchase, IPurchase, Supplier, ISupplier, Product, StockLedger, AuditLog } from '../models';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';
import { Money } from '../utils/money';
import { FinancialYear } from '../utils/financialYear';

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
  costPrice: number;
  gstRate?: number;
  discount?: number;
}

export interface CreatePurchaseInput {
  supplierId: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: Date;
  purchaseDate?: Date;
  items: CreatePurchaseItemInput[];
  notes?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  paidAmount?: number;
}

export class PurchaseService {
  // ==================== SUPPLIERS ====================

  static async createSupplier(data: Partial<ISupplier>, userId: string, userName: string): Promise<ISupplier> {
    const supplier = new Supplier(data);
    await supplier.save();

    await AuditLog.create({
      action: 'SUPPLIER_CREATED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Supplier',
      targetId: supplier._id,
      metadata: { name: supplier.name },
    });

    return supplier;
  }

  static async updateSupplier(id: string, data: Partial<ISupplier>, userId: string, userName: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw ApiError.notFound('Supplier not found');
    }
    Object.assign(supplier, data);
    await supplier.save();

    await AuditLog.create({
      action: 'SUPPLIER_UPDATED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Supplier',
      targetId: supplier._id,
      metadata: { name: supplier.name },
    });

    return supplier;
  }

  static async getSuppliers(search?: string) {
    const query: any = { isActive: true };
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { phone: regex }, { gstin: regex }];
    }
    return Supplier.find(query).sort({ name: 1 }).lean();
  }

  static async getSupplierById(id: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw ApiError.notFound('Supplier not found');
    return supplier;
  }

  // ==================== PURCHASES ====================

  static async createPurchase(input: CreatePurchaseInput, userId: string, userName: string): Promise<IPurchase> {
    const supplier = await Supplier.findById(input.supplierId);
    if (!supplier) {
      throw ApiError.notFound('Supplier not found');
    }

    if (!input.items || input.items.length === 0) {
      throw ApiError.badRequest('Purchase must have at least one item');
    }

    let subtotal = Money.from(0);
    let totalTax = Money.from(0);
    let totalDiscount = Money.from(0);
    let grandTotal = Money.from(0);

    const evaluatedItems: any[] = [];

    for (const it of input.items) {
      const product = await Product.findById(it.productId);
      if (!product) {
        throw ApiError.notFound(`Product not found: ${it.productId}`);
      }

      const cost = Money.from(it.costPrice);
      const qty = Money.from(it.quantity);
      const lineGross = Money.multiply(cost, qty);

      const disc = Money.from(it.discount || 0);
      const lineTaxable = Money.subtract(lineGross, disc);

      const gst = it.gstRate !== undefined ? it.gstRate : (product.gstRate || 0);
      const taxRes = Money.calculateGSTExclusive(lineTaxable, gst);

      subtotal = Money.add(subtotal, lineGross);
      totalDiscount = Money.add(totalDiscount, disc);
      totalTax = Money.add(totalTax, taxRes.totalTax);
      grandTotal = Money.add(grandTotal, taxRes.total);

      evaluatedItems.push({
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        quantity: it.quantity,
        receivedQuantity: it.quantity, // Immediately inwarded
        costPrice: it.costPrice,
        gstRate: gst,
        cgst: Money.toNumber(taxRes.cgst),
        sgst: Money.toNumber(taxRes.sgst),
        igst: 0,
        discount: it.discount || 0,
        lineTotal: Money.toNumber(taxRes.total),
      });
    }

    // Generate purchase number
    const pCount = await Purchase.countDocuments();
    const purchaseNumber = `PO/${FinancialYear.getFinancialYear()}/${String(pCount + 1).padStart(5, '0')}`;

    const purchase = new Purchase({
      purchaseNumber,
      supplier: supplier._id,
      supplierName: supplier.name,
      supplierInvoiceNumber: input.supplierInvoiceNumber,
      supplierInvoiceDate: input.supplierInvoiceDate,
      purchaseDate: input.purchaseDate || new Date(),
      items: evaluatedItems,
      subtotal: Money.toNumber(Money.round2(subtotal)),
      totalTax: Money.toNumber(Money.round2(totalTax)),
      totalDiscount: Money.toNumber(Money.round2(totalDiscount)),
      grandTotal: Money.toNumber(Money.round2(grandTotal)),
      paymentStatus: input.paymentStatus || 'unpaid',
      paidAmount: input.paidAmount || 0,
      status: 'received',
      notes: input.notes,
      createdBy: new Types.ObjectId(userId),
    });

    await purchase.save();

    // Inward stock into product inventory
    for (const item of evaluatedItems) {
      const product = await Product.findById(item.product);
      if (product) {
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + item.quantity;

        product.currentStock = stockAfter;
        // Optionally update cost price to newest inward rate
        product.costPrice = item.costPrice;
        await product.save();

        await StockLedger.create({
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          movementType: 'purchase',
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          reference: purchase.purchaseNumber,
          referenceType: 'purchase',
          reason: `Stock Inward via PO #${purchase.purchaseNumber}`,
          user: new Types.ObjectId(userId),
          userName,
        });
      }
    }

    await AuditLog.create({
      action: 'PURCHASE_CREATED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Purchase',
      targetId: purchase._id,
      metadata: { purchaseNumber, supplier: supplier.name, grandTotal: purchase.grandTotal },
    });

    return purchase;
  }

  static async getPurchases(page: number = 1, limit: number = 20, supplierId?: string, status?: string) {
    const query: any = {};
    if (supplierId) query.supplier = new Types.ObjectId(supplierId);
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      Purchase.find(query)
        .populate('supplier', 'name phone gstin')
        .populate('createdBy', 'name username')
        .sort({ purchaseDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(query),
    ]);

    return {
      purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPurchaseById(id: string): Promise<IPurchase> {
    const purchase = await Purchase.findById(id)
      .populate('supplier', 'name phone address gstin')
      .populate('createdBy', 'name username');
    if (!purchase) throw ApiError.notFound('Purchase record not found');
    return purchase;
  }
}
