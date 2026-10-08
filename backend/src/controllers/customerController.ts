import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';

export class CustomerController {
  static async createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.created(res, customer);
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.updateCustomer(
        req.params.id,
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, customer);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, hasOutstanding, isActive, page, limit, sortBy, sortOrder } = req.query;

      const result = await CustomerService.getCustomers({
        search: search as string,
        hasOutstanding: hasOutstanding === 'true',
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
      });

      return ApiResponse.paginated(
        res,
        result.customers,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit
      );
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      return ApiResponse.success(res, customer);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount, paymentMethod, referenceId, billId, notes } = req.body;
      const payment = await CustomerService.recordPayment(
        req.params.id,
        amount,
        paymentMethod,
        req.user!._id.toString(),
        req.user!.name,
        referenceId,
        billId,
        notes
      );
      return ApiResponse.created(res, payment);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const { fromDate, toDate } = req.query;
      const ledger = await CustomerService.getCustomerLedger(
        req.params.id,
        fromDate as string,
        toDate as string
      );
      return ApiResponse.success(res, ledger);
    } catch (error) {
      next(error);
    }
  }
}
