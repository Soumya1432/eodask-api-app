import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Parse the entire request object (body, query, params)
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.errors
          .map((e) => {
            const path = e.path.join('.');
            return path ? `${path}: ${e.message}` : e.message;
          })
          .join(', ');
        throw ApiError.badRequest(`Validation error: ${errors}`);
      }

      // Apply validated data back to request
      if (result.data.body) req.body = result.data.body;
      // Note: req.query and req.params are read-only in some Express versions
      // We only need to validate them, not reassign

      next();
    } catch (error) {
      next(error);
    }
  };
};
