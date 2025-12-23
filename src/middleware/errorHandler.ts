import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
