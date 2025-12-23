import type { Request } from 'express';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role?: Role;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: Role;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type { Role } from '@prisma/client';
