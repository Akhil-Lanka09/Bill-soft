import { User, IUser, AuditLog } from '../models';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

export class UserService {
  /**
   * Create new user
   */
  static async createUser(data: Partial<IUser>, createdBy: string, createdByName: string): Promise<IUser> {
    const existing = await User.findOne({ username: data.username?.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('Username is already taken');
    }

    if (data.email) {
      const emailExists = await User.findOne({ email: data.email.toLowerCase() });
      if (emailExists) {
        throw ApiError.conflict('Email is already registered');
      }
    }

    const user = new User({
      ...data,
      username: data.username?.toLowerCase(),
      email: data.email?.toLowerCase(),
    });

    await user.save();

    await AuditLog.create({
      action: 'USER_CREATED',
      user: new Types.ObjectId(createdBy),
      userName: createdByName,
      targetModel: 'User',
      targetId: user._id,
      metadata: { username: user.username, role: user.role },
    });

    return user;
  }

  /**
   * List all staff members
   */
  static async getUsers() {
    return User.find().select('-password').sort({ createdAt: -1 }).lean();
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id).select('-password');
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  /**
   * Update user details or role
   */
  static async updateUser(id: string, data: Partial<IUser>, updatedBy: string, updatedByName: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    if (data.username && data.username.toLowerCase() !== user.username) {
      const existing = await User.findOne({ username: data.username.toLowerCase(), _id: { $ne: user._id } });
      if (existing) throw ApiError.conflict('Username is already taken');
      user.username = data.username.toLowerCase();
    }

    if (data.name) user.name = data.name;
    if (data.role) user.role = data.role;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.email !== undefined) user.email = data.email?.toLowerCase();
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await user.save();

    await AuditLog.create({
      action: 'USER_UPDATED',
      user: new Types.ObjectId(updatedBy),
      userName: updatedByName,
      targetModel: 'User',
      targetId: user._id,
      metadata: { username: user.username, role: user.role, isActive: user.isActive },
    });

    return user;
  }

  /**
   * Admin reset password for an employee
   */
  static async resetPassword(id: string, newPassword: string, adminId: string, adminName: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_RESET',
      user: new Types.ObjectId(adminId),
      userName: adminName,
      entity: 'User',
      entityId: user._id,
      metadata: { targetUser: user.username },
    });
  }

  /**
   * Delete employee account
   */
  static async deleteUser(id: string, adminId: string, adminName: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    if (user._id.toString() === adminId) {
      throw ApiError.badRequest('You cannot delete your own active administrator account');
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw ApiError.badRequest('Cannot delete the last remaining administrator account');
      }
    }

    const username = user.username;
    const name = user.name;
    const role = user.role;

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'USER_DELETED',
      user: new Types.ObjectId(adminId),
      userName: adminName,
      entity: 'User',
      entityId: user._id,
      metadata: { deletedUser: username, name, role },
    });
  }
}
