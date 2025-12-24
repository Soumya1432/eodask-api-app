import dotenv from 'dotenv';
dotenv.config();
// Parse comma-separated CORS origins or use defaults
const parseOrigins = () => {
    const clientUrl = process.env.CLIENT_URL;
    if (clientUrl) {
        // Support comma-separated origins
        const origins = clientUrl.split(',').map(o => o.trim());
        return origins.length === 1 ? origins[0] : origins;
    }
    // Default origins for development
    return ['http://localhost:3000', 'http://localhost:5173'];
};
export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    cors: {
        origin: parseOrigins(),
        credentials: true,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'onething <noreply@onething.com>',
    },
    upload: {
        dir: process.env.UPLOAD_DIR || 'uploads',
        maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
};
//# sourceMappingURL=index.js.map