import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getUsers();
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.createUser(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.created(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateUser(
        req.params.id,
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      await UserService.resetPassword(
        req.params.id,
        newPassword,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, { message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await UserService.deleteUser(
        req.params.id,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, { message: 'Staff member deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
