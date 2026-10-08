import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';
import { Category } from '../models';

export class ProductController {
  static async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const products = await ProductService.searchProducts(q, limit);
      return ApiResponse.success(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        category,
        isActive,
        priceStatus,
        stockStatus,
        page,
        limit,
        sortBy,
        sortOrder,
        includeArchived,
      } = req.query;

      const result = await ProductService.getProducts({
        search: search as string,
        category: category as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        priceStatus: priceStatus as string,
        stockStatus: stockStatus as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
        includeArchived: includeArchived === 'true',
      });

      return ApiResponse.paginated(res, result.products, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(req.params.id, true);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.created(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(
        req.params.id,
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async archiveProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.archiveProduct(
        req.params.id,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async restoreProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.restoreProduct(
        req.params.id,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { quantity, type, reason } = req.body;
      const product = await ProductService.adjustStock(
        req.params.id,
        quantity,
        type,
        reason,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async reconcileStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { physicalStock, reason } = req.body;
      const product = await ProductService.reconcileStock(
        req.params.id,
        physicalStock,
        reason,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async getStockHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await ProductService.getStockHistory(req.params.id, page, limit);
      return ApiResponse.paginated(res, result.entries, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  static async getInventorySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await ProductService.getInventorySummary();
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  // Categories
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
      return ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await Category.create(req.body);
      return ApiResponse.created(res, category);
    } catch (error) {
      next(error);
    }
  }
}
