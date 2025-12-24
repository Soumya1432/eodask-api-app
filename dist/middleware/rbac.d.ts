import type { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import type { AuthRequest } from '../types/index.js';
export declare const requireRole: (...allowedRoles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireMinRole: (minRole: Role) => (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireProjectRole: (...allowedRoles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireProjectAccess: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rbac.d.ts.map