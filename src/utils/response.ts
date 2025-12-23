import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: ApiResponse<T>
): Response => {
  return res.status(statusCode).json(data);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response => {
  return sendResponse(res, statusCode, {
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  return sendResponse(res, statusCode, {
    success: false,
    message,
    error,
  });
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T[],
  pagination: { page: number; limit: number; total: number }
): Response => {
  return sendResponse(res, 200, {
    success: true,
    message,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};
