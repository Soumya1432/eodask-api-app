import type { Request, Response, NextFunction, RequestHandler } from 'express';
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare const asyncHandler: (fn: AsyncFunction) => RequestHandler;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map