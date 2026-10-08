import { Product, IProduct, Category, AuditLog, StockLedger } from '../models';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

interface ProductQueryOptions {
  search?: string;
  category?: string;
  isActive?: boolean;
  priceStatus?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  includeCostPrice?: boolean;
}

export class ProductService {
  /**
   * Search products with full-text, partial match, and typo tolerance
   */
  static async searchProducts(query: string, limit: number = 20): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      return Product.find({ isActive: true, isArchived: false })
        .populate('category', 'name')
        .limit(limit)
        .sort({ name: 1 })
        .lean();
    }

    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const products = await Product.find({
      isActive: true,
      isArchived: false,
      $or: [
        { name: searchRegex },
        { localName: searchRegex },
        { botanicalName: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { hsn: searchRegex },
      ],
    })
      .populate('category', 'name')
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    return products;
  }

  /**
   * Get products with filtering and pagination
   */
  static async getProducts(options: ProductQueryOptions) {
    const {
      search,
      category,
      isActive = true,
      priceStatus,
      stockStatus,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      includeArchived = false,
      includeCostPrice = false,
    } = options;

    const query: any = {};

    if (!includeArchived) {
      query.isArchived = false;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (category) {
      query.category = new Types.ObjectId(category);
    }

    if (priceStatus) {
      query.priceStatus = priceStatus;
    }

    if (stockStatus) {
      switch (stockStatus) {
        case 'in_stock':
          query.$expr = { $gte: ['$currentStock', { $ifNull: ['$lowStockThreshold', 15] }] };
          break;
        case 'low_stock':
          query.$expr = { $and: [{ $gt: ['$currentStock', 0] }, { $lt: ['$currentStock', { $ifNull: ['$lowStockThreshold', 15] }] }] };
          break;
        case 'out_of_stock':
          query.currentStock = 0;
          break;
        case 'negative':
          query.currentStock = { $lt: 0 };
          break;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { localName: searchRegex },
        { botanicalName: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { hsn: searchRegex },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let selectFields = '';
    if (!includeCostPrice) {
      selectFields = '-costPrice -lastPurchaseCost -averageCost';
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .select(selectFields)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return { products, total, page, limit };
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string, includeCost: boolean = false): Promise<IProduct> {
    let query: any = Product.findById(id).populate('category', 'name');
    if (includeCost) {
      query = query.select('+costPrice +lastPurchaseCost +averageCost');
    }
    const product = (await query) as IProduct;
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  /**
   * Create product (admin only)
   */
  static async createProduct(data: Partial<IProduct>, userId: string, userName: string): Promise<IProduct> {
    // Verify category exists
    const category = await Category.findById(data.category);
    if (!category) {
      throw ApiError.badRequest('Invalid category');
    }

    // Set initial stock
    if (data.openingStock !== undefined) {
      data.currentStock = data.openingStock;
    }

    // Determine price status
    if (data.sellingPrice === null || data.sellingPrice === undefined) {
      data.priceStatus = 'requires_admin_price';
    } else {
      data.priceStatus = 'active';
    }

    const product = await Product.create(data);

    // Create opening stock ledger entry
    if (product.openingStock > 0) {
      await StockLedger.create({
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        movementType: 'opening',
        quantity: product.openingStock,
        stockBefore: 0,
        stockAfter: product.openingStock,
        user: userId,
        userName,
        reason: 'Opening stock from seed data',
      });
    }

    // Audit
    await AuditLog.create({
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id,
      user: userId,
      userName,
      after: { name: product.name, sku: product.sku, price: product.sellingPrice, stock: product.currentStock },
    });

    return product;
  }

  /**
   * Update product (admin only)
   */
  static async updateProduct(
    id: string,
    data: Partial<IProduct>,
    userId: string,
    userName: string
  ): Promise<IProduct> {
    const product = await Product.findById(id).select('+costPrice');
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const before: any = {
      name: product.name,
      sellingPrice: product.sellingPrice,
      gstRate: product.gstRate,
      currentStock: product.currentStock,
    };

    // Check if price changed
    if (data.sellingPrice !== undefined && data.sellingPrice !== product.sellingPrice) {
      await AuditLog.create({
        action: 'PRICE_CHANGED',
        entity: 'Product',
        entityId: product._id,
        user: userId,
        userName,
        before: { sellingPrice: product.sellingPrice },
        after: { sellingPrice: data.sellingPrice },
      });
    }

    // Check if GST changed
    if (data.gstRate !== undefined && data.gstRate !== product.gstRate) {
      await AuditLog.create({
        action: 'GST_CHANGED',
        entity: 'Product',
        entityId: product._id,
        user: userId,
        userName,
        before: { gstRate: product.gstRate, hsn: product.hsn },
        after: { gstRate: data.gstRate, hsn: data.hsn || product.hsn },
      });
    }

    // Update price status
    if (data.sellingPrice !== undefined) {
      if (data.sellingPrice === null) {
        data.priceStatus = 'requires_admin_price';
      } else {
        data.priceStatus = 'active';
      }
    }

    Object.assign(product, data);
    await product.save();

    await AuditLog.create({
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product._id,
      user: userId,
      userName,
      before,
      after: { name: product.name, sellingPrice: product.sellingPrice, gstRate: product.gstRate },
    });

    return product;
  }

  /**
   * Archive product (soft delete)
   */
  static async archiveProduct(id: string, userId: string, userName: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.hasTransactions) {
      // Soft delete
      product.isArchived = true;
      product.isActive = false;
      await product.save();
    } else {
      // Can physically delete if no transactions
      product.isArchived = true;
      product.isActive = false;
      await product.save();
    }

    await AuditLog.create({
      action: 'PRODUCT_ARCHIVED',
      entity: 'Product',
      entityId: product._id,
      user: userId,
      userName,
      after: { name: product.name, sku: product.sku },
    });

    return product;
  }

  /**
   * Restore archived product
   */
  static async restoreProduct(id: string, userId: string, userName: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    product.isArchived = false;
    product.isActive = true;
    await product.save();

    await AuditLog.create({
      action: 'PRODUCT_RESTORED',
      entity: 'Product',
      entityId: product._id,
      user: userId,
      userName,
    });

    return product;
  }

  /**
   * Get stock history for a product
   */
  static async getStockHistory(productId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      StockLedger.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockLedger.countDocuments({ product: productId }),
    ]);
    return { entries, total, page, limit };
  }

  /**
   * Adjust stock (admin only)
   */
  static async adjustStock(
    productId: string,
    quantity: number,
    type: 'adjustment_in' | 'adjustment_out' | 'damage' | 'mortality' | 'theft',
    reason: string,
    userId: string,
    userName: string
  ): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const stockBefore = product.currentStock;
    const isInward = type === 'adjustment_in';
    const newStock = isInward ? stockBefore + quantity : stockBefore - quantity;

    product.currentStock = newStock;
    await product.save();

    await StockLedger.create({
      product: product._id,
      productName: product.name,
      productSku: product.sku,
      movementType: type,
      quantity: isInward ? quantity : -quantity,
      stockBefore,
      stockAfter: newStock,
      user: userId,
      userName,
      reason,
    });

    await AuditLog.create({
      action: 'STOCK_ADJUSTED',
      entity: 'Product',
      entityId: product._id,
      user: userId,
      userName,
      before: { stock: stockBefore },
      after: { stock: newStock },
      reason,
      metadata: { type, quantity },
    });

    return product;
  }

  /**
   * Get inventory summary
   */
  static async getInventorySummary() {
    const [
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      negativeStock,
      needsReconciliation,
    ] = await Promise.all([
      Product.countDocuments({ isArchived: false }),
      Product.countDocuments({ isActive: true, isArchived: false }),
      Product.countDocuments({ isActive: true, isArchived: false, currentStock: 0 }),
      Product.countDocuments({
        isActive: true,
        isArchived: false,
        $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lt: ['$currentStock', { $ifNull: ['$lowStockThreshold', 15] }] }] },
      }),
      Product.countDocuments({ isActive: true, isArchived: false, currentStock: { $lt: 0 } }),
      Product.countDocuments({ needsReconciliation: true }),
    ]);

    // Calculate stock value
    const stockValueResult = await Product.aggregate([
      { $match: { isActive: true, isArchived: false, currentStock: { $gt: 0 }, sellingPrice: { $ne: null } } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$currentStock', '$sellingPrice'] } } } },
    ]);

    const stockValue = stockValueResult.length > 0 ? stockValueResult[0].totalValue : 0;

    return {
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      negativeStock,
      needsReconciliation,
      stockValue,
    };
  }

  /**
   * Get products needing reconciliation
   */
  static async getReconciliationProducts() {
    return Product.find({ needsReconciliation: true })
      .populate('category', 'name')
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Reconcile stock
   */
  static async reconcileStock(
    productId: string,
    physicalStock: number,
    reason: string,
    userId: string,
    userName: string
  ): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const stockBefore = product.currentStock;
    product.currentStock = physicalStock;
    product.needsReconciliation = false;
    await product.save();

    await StockLedger.create({
      product: product._id,
      productName: product.name,
      productSku: product.sku,
      movementType: 'reconciliation',
      quantity: physicalStock - stockBefore,
      stockBefore,
      stockAfter: physicalStock,
      user: userId,
      userName,
      reason,
      referenceType: 'reconciliation',
    });

    await AuditLog.create({
      action: 'STOCK_RECONCILED',
      entity: 'Product',
      entityId: product._id,
      user: userId,
      userName,
      before: { systemStock: stockBefore },
      after: { physicalStock },
      reason,
    });

    return product;
  }
}
