import jwt from 'jsonwebtoken';
import config from '../config';
import { User, IUser, AuditLog } from '../models';
import { ApiError } from '../utils/ApiError';

export class AuthService {
  /**
   * Login user
   */
  static async login(username: string, password: string, ip: string, userAgent: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

    if (!user) {
      // Log failed attempt
      await AuditLog.create({
        action: 'LOGIN_FAILURE',
        userName: username,
        ip,
        userAgent,
        reason: 'User not found',
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked()) {
      await AuditLog.create({
        action: 'LOGIN_FAILURE',
        user: user._id,
        userName: user.name,
        userRole: user.role,
        ip,
        userAgent,
        reason: 'Account locked',
      });
      throw ApiError.accountLocked(`Account is locked. Try again later.`);
    }

    // Check if account is active
    if (!user.isActive) {
      throw ApiError.unauthorized('Account is disabled');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= config.auth.maxLoginAttempts) {
        user.lockUntil = new Date(Date.now() + config.auth.lockoutMinutes * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();

      await AuditLog.create({
        action: 'LOGIN_FAILURE',
        user: user._id,
        userName: user.name,
        userRole: user.role,
        ip,
        userAgent,
        reason: 'Invalid password',
        metadata: { attemptNumber: user.loginAttempts },
      });

      throw ApiError.unauthorized('Invalid credentials');
    }

    // Reset failed attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    // Audit log
    await AuditLog.create({
      action: 'LOGIN_SUCCESS',
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ip,
      userAgent,
    });

    return { user, token };
  }

  /**
   * Get current user profile
   */
  static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_CHANGED',
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ip,
      userAgent,
    });
  }
}
