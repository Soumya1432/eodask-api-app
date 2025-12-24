export declare const config: {
    port: number;
    nodeEnv: string;
    clientUrl: string;
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    upload: {
        dir: string;
        maxSize: number;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
};
//# sourceMappingURL=index.d.ts.map