import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';
import { Expense } from '../models';
import { Types } from 'mongoose';

export class ReportController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await ReportService.getDashboardSummary();
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await ReportService.getSalesReport(startDate as string, endDate as string);
      return ApiResponse.success(res, report);
    } catch (error) {
      next(error);
    }
  }

  static async getGSTR1(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return ApiResponse.error(res, 400, 'startDate and endDate are required');
      }
      const report = await ReportService.getGSTR1Report(startDate as string, endDate as string);
      return ApiResponse.success(res, report);
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getInventoryValuation();
      return ApiResponse.success(res, report);
    } catch (error) {
      next(error);
    }
  }

  static async getDailyClosing(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const closing = await ReportService.getDailyClosingData(date as string);
      return ApiResponse.success(res, closing);
    } catch (error) {
      next(error);
    }
  }

  static async submitDailyClosing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const closing = await ReportService.submitDailyClosing(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.created(res, closing);
    } catch (error) {
      next(error);
    }
  }

  // Expenses
  static async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, category } = req.query;
      const query: any = {};
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date((startDate as string).includes('T') ? (startDate as string) : `${startDate}T00:00:00.000Z`);
        if (endDate) query.date.$lte = new Date((endDate as string).includes('T') ? (endDate as string) : `${endDate}T23:59:59.999Z`);
      }
      if (category) query.category = category;

      const expenses = await Expense.find(query).sort({ date: -1 }).lean();
      return ApiResponse.success(res, expenses);
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = new Expense({
        ...req.body,
        createdBy: new Types.ObjectId(req.user!._id),
        createdByName: req.user!.name,
      });
      await expense.save();
      return ApiResponse.created(res, expense);
    } catch (error) {
      next(error);
    }
  }
}
