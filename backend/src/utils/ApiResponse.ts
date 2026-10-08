import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface ApiResponseOptions {
  success: boolean;
  data?: any;
  message?: string;
  code?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standardized API response helper
 */
export class ApiResponse {
  static success(res: Response, data: any = null, statusCode: number = 200, meta?: any) {
    const response: any = {
      success: true,
      requestId: uuidv4(),
    };
    if (data !== null) response.data = data;
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res: Response, data: any = null) {
    return ApiResponse.success(res, data, 201);
  }

  static error(res: Response, statusCode: number, message: string, code: string = 'ERROR') {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      requestId: uuidv4(),
    });
  }

  static paginated(res: Response, data: any[], total: number, page: number, limit: number) {
    return res.status(200).json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      requestId: uuidv4(),
    });
  }
}
