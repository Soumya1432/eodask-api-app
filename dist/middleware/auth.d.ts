import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
export declare const authenticate: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map