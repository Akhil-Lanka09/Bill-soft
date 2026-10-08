import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      return ApiResponse.success(res, settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.updateSettings(
        req.body,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, settings);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOverridePin(req: Request, res: Response, next: NextFunction) {
    try {
      const { pin } = req.body;
      if (!pin) {
        return ApiResponse.error(res, 400, 'PIN is required');
      }
      await SettingsService.verifyOverridePin(pin);
      return ApiResponse.success(res, { verified: true, message: 'Manager override authorized' });
    } catch (error) {
      next(error);
    }
  }

  static async updateOverridePin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPin, newPin } = req.body;
      await SettingsService.updateOverridePin(
        currentPin,
        newPin,
        req.user!._id.toString(),
        req.user!.name
      );
      return ApiResponse.success(res, { message: 'Override PIN updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
