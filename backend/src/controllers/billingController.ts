import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billingService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';

export class BillingController {
  static async calculateSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, discountType, discountValue, customerState } = req.body;
      const summary = await BillingService.calculateBillSummary(
        items,
        discountType,
        discountValue,
        customerState
      );
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  static async createBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const bill = await BillingService.createBill(
        {
          ...req.body,
          agentId: req.user!._id.toString(),
          agentName: req.user!.name,
        },
        ip,
        userAgent
      );

      return ApiResponse.created(res, bill);
    } catch (error) {
      next(error);
    }
  }

  static async getBills(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        startDate,
        endDate,
        agentId,
        customerId,
        paymentStatus,
        status,
        billType,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await BillingService.getBills({
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        agentId: agentId as string,
        customerId: customerId as string,
        paymentStatus: paymentStatus as string,
        status: status as string,
        billType: billType as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
      });

      return ApiResponse.paginated(
        res,
        result.bills,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit
      );
    } catch (error) {
      next(error);
    }
  }

  static async getBillById(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await BillingService.getBillById(req.params.id);
      return ApiResponse.success(res, bill);
    } catch (error) {
      next(error);
    }
  }

  static async getThermalReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const receiptData = await BillingService.getThermalReceiptData(req.params.id);
      return ApiResponse.success(res, receiptData);
    } catch (error) {
      next(error);
    }
  }

  static async cancelBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const bill = await BillingService.cancelBill(
        req.params.id,
        reason || 'Cancelled by manager',
        req.user!._id.toString(),
        req.user!.name,
        ip,
        userAgent
      );

      return ApiResponse.success(res, bill);
    } catch (error) {
      next(error);
    }
  }

  static async processReturn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { items, reason } = req.body;
      const creditNote = await BillingService.processReturn(
        req.params.id,
        items,
        reason || 'Customer return',
        req.user!._id.toString(),
        req.user!.name
      );

      return ApiResponse.success(res, creditNote);
    } catch (error) {
      next(error);
    }
  }

  static async holdBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { items, subtotal, customerId, customerName, customerPhone, notes } = req.body;
      const held = await BillingService.holdBill(
        req.user!._id.toString(),
        req.user!.name,
        items,
        subtotal,
        customerId,
        customerName,
        customerPhone,
        notes
      );
      return ApiResponse.created(res, held);
    } catch (error) {
      next(error);
    }
  }

  static async getHeldBills(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const held = await BillingService.getHeldBills();
      return ApiResponse.success(res, held);
    } catch (error) {
      next(error);
    }
  }

  static async deleteHeldBill(req: Request, res: Response, next: NextFunction) {
    try {
      await BillingService.deleteHeldBill(req.params.id);
      return ApiResponse.success(res, { message: 'Held cart removed' });
    } catch (error) {
      next(error);
    }
  }
}
