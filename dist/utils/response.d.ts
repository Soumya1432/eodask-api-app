import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';
export declare const sendResponse: <T>(res: Response, statusCode: number, data: ApiResponse<T>) => Response;
export declare const sendSuccess: <T>(res: Response, message: string, data?: T, statusCode?: number) => Response;
export declare const sendError: (res: Response, message: string, statusCode?: number, error?: string) => Response;
export declare const sendPaginated: <T>(res: Response, message: string, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
}) => Response;
//# sourceMappingURL=response.d.ts.map