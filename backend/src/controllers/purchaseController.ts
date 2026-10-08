import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from '../services/purchaseService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';

export class PurchaseController {
  // Suppliers
  static async getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await PurchaseService.getSuppliers(req.query.search as string);
      return ApiResponse.success(res, suppliers);
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await PurchaseService.createSupplier(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.created(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await PurchaseService.updateSupplier(
        req.params.id,
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  // Purchases
  static async getPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const supplierId = req.query.supplierId as string;
      const status = req.query.status as string;

      const result = await PurchaseService.getPurchases(page, limit, supplierId, status);
      return ApiResponse.paginated(
        res,
        result.purchases,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit
      );
    } catch (error) {
      next(error);
    }
  }

  static async getPurchaseById(req: Request, res: Response, next: NextFunction) {
    try {
      const purchase = await PurchaseService.getPurchaseById(req.params.id);
      return ApiResponse.success(res, purchase);
    } catch (error) {
      next(error);
    }
  }

  static async createPurchase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const purchase = await PurchaseService.createPurchase(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.created(res, purchase);
    } catch (error) {
      next(error);
    }
  }
}
