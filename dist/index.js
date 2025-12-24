import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket, setSocketEmitter } from './socket/index.js';
import { schedulerService } from './services/scheduler.service.js';
import prisma from './lib/prisma.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create Express app
const app = express();
// Create HTTP server
const httpServer = createServer(app);
// Initialize Socket.io
const io = initializeSocket(httpServer);
setSocketEmitter(io);
// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS configuration
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Compression
app.use(compression());
// Request logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}
else {
    app.use(morgan('combined'));
}
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));
// API routes
app.use('/api', routes);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
// Error handler
app.use(errorHandler);
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    // Stop scheduler
    schedulerService.stopAll();
    // Close Socket.io
    io.close(() => {
        console.log('Socket.io closed');
    });
    // Close database connection
    await prisma.$disconnect();
    console.log('Database connection closed');
    // Close HTTP server
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Start server
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('Database connected successfully');
        // Initialize scheduler
        schedulerService.init();
        // Start HTTP server
        httpServer.listen(config.port, () => {
            console.log(`
========================================
  onething API Server
========================================
  Environment: ${config.nodeEnv}
  Port: ${config.port}
  API URL: http://localhost:${config.port}/api
  Health: http://localhost:${config.port}/api/health
========================================
      `);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
export { app, httpServer, io };
//# sourceMappingURL=index.js.map