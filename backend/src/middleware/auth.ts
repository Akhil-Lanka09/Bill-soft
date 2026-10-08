import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, IUser } from '../models';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * JWT authentication middleware
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is disabled');
    }

    if (user.isLocked()) {
      throw ApiError.accountLocked('Account is temporarily locked');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Token expired'));
    }
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied. Required role: ${roles.join(' or ')}`));
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const adminOnly = authorize('admin');

/**
 * Manager or Admin middleware
 */
export const managerOrAdmin = authorize('admin', 'manager');

/**
 * Agent or Admin middleware
 */
export const agentOrAdmin = authorize('admin', 'manager', 'agent');
