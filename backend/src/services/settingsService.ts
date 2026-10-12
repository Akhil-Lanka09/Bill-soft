import bcrypt from 'bcryptjs';
import { Settings, ISettings, AuditLog } from '../models';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';
import config from '../config';

export class SettingsService {
  /**
   * Get application settings (creating default if none exists)
   */
  static async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne();
    if (!settings) {
      const pinHash = await bcrypt.hash('9900', config.auth.saltRounds);
      settings = await Settings.create({
        businessName: config.business.name,
        address: 'Main Road',
        city: 'Vissannapeta',
        state: config.business.state,
        pincode: '521215',
        gstin: config.business.gstin,
        phone: config.business.phone,
        overridePinHash: pinHash,
      });
    }
    return settings as ISettings;
  }

  /**
   * Update application settings
   */
  static async updateSettings(data: Partial<ISettings>, userId: string, userName: string): Promise<ISettings> {
    let settings: any = await Settings.findOne();
    if (!settings) {
      settings = await SettingsService.getSettings();
    }

    // Do not overwrite overridePinHash directly through general update
    delete (data as any).overridePinHash;

    Object.assign(settings!, data);
    await settings!.save();

    await AuditLog.create({
      action: 'SETTINGS_UPDATED',
      user: new Types.ObjectId(userId),
      userName,
      entity: 'Settings',
      entityId: settings!._id,
      metadata: { businessName: settings!.businessName },
    });

    return settings! as ISettings;
  }

  /**
   * Update manager override PIN
   */
  static async updateOverridePin(currentPin: string, newPin: string, userId: string, userName: string): Promise<void> {
    const settings = await Settings.findOne().select('+overridePinHash');
    if (!settings) {
      throw ApiError.notFound('Settings not found');
    }

    if (newPin.length < 4) {
      throw ApiError.badRequest('New PIN must be at least 4 digits');
    }

    const isValid = await bcrypt.compare(currentPin, settings.overridePinHash);
    if (!isValid) {
      throw ApiError.unauthorized('Current override PIN is incorrect');
    }

    settings.overridePinHash = await bcrypt.hash(newPin, config.auth.saltRounds);
    settings.overrideFailedAttempts = 0;
    settings.overrideLockUntil = undefined;
    await settings.save();

    await AuditLog.create({
      action: 'OVERRIDE_PIN_CHANGED',
      user: new Types.ObjectId(userId),
      userName,
      targetModel: 'Settings',
      targetId: settings._id,
    });
  }

  /**
   * Verify Manager Override PIN for discount / price / negative stock bypass
   */
  static async verifyOverridePin(pin: string): Promise<boolean> {
    const settings = await Settings.findOne().select('+overridePinHash');
    if (!settings) {
      return pin === '9900';
    }

    if (settings.overrideLockUntil && settings.overrideLockUntil > new Date()) {
      throw ApiError.forbidden('Override PIN is temporarily locked due to multiple failed attempts. Try again later.');
    }

    const isMatch = await bcrypt.compare(pin, settings.overridePinHash);
    if (!isMatch) {
      settings.overrideFailedAttempts = (settings.overrideFailedAttempts || 0) + 1;
      if (settings.overrideFailedAttempts >= 5) {
        settings.overrideLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        settings.overrideFailedAttempts = 0;
      }
      await settings.save();
      throw ApiError.unauthorized('Invalid manager override PIN');
    }

    settings.overrideFailedAttempts = 0;
    await settings.save();
    return true;
  }
}
