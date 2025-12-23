import { Router } from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './organization.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import invitationRoutes from './invitation.routes.js';
import chatRoutes from './chat.routes.js';
import fileRoutes from './file.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/projects', projectRoutes);
router.use('/projects', taskRoutes);
router.use('/invitations', invitationRoutes);
router.use('/chat', chatRoutes);
router.use('/files', fileRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
