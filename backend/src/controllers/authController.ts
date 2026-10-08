import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await AuthService.login(username, password, ip, userAgent);
      return ApiResponse.success(res, {
        user: {
          id: result.user._id,
          username: result.user.username,
          name: result.user.name,
          role: result.user.role,
          phone: result.user.phone,
          email: result.user.email,
        },
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!._id.toString());
      return ApiResponse.success(res, {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        lastLogin: user.lastLogin,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await AuthService.changePassword(
        req.user!._id.toString(),
        currentPassword,
        newPassword,
        ip,
        userAgent
      );

      return ApiResponse.success(res, { message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
