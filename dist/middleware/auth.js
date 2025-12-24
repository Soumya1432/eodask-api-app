import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
export const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;
        if (!token) {
            throw ApiError.unauthorized('Access token is required');
        }
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, isActive: true },
        });
        if (!user) {
            throw ApiError.unauthorized('User not found');
        }
        if (!user.isActive) {
            throw ApiError.forbidden('Account is deactivated');
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(ApiError.unauthorized('Invalid token'));
        }
        else if (error instanceof jwt.TokenExpiredError) {
            next(ApiError.unauthorized('Token expired'));
        }
        else {
            next(error);
        }
    }
};
export const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;
        if (token) {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
        }
        next();
    }
    catch {
        // Token invalid, continue without user
        next();
    }
};
//# sourceMappingURL=auth.js.map