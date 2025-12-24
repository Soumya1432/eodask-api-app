import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map