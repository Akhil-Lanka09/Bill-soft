/**
 * Custom API Error class with HTTP status codes and error codes.
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, code: string = 'ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST') {
    return new ApiError(400, message, code);
  }

  static unauthorized(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code: string = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static tooMany(message: string = 'Too many requests', code: string = 'RATE_LIMIT') {
    return new ApiError(429, message, code);
  }

  static internal(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code, false);
  }

  static insufficientStock(message: string = 'Insufficient stock') {
    return new ApiError(400, message, 'INSUFFICIENT_STOCK');
  }

  static overrideLocked(message: string = 'Override locked due to too many failed attempts') {
    return new ApiError(423, message, 'OVERRIDE_LOCKED');
  }

  static accountLocked(message: string = 'Account is locked') {
    return new ApiError(423, message, 'ACCOUNT_LOCKED');
  }

  static priceRequired(message: string = 'Product requires admin price') {
    return new ApiError(400, message, 'PRICE_REQUIRED');
  }
}
