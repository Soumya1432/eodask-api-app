import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as analyticsController from '../controllers/analytics.controller.js';
const router = Router();
const organizationIdSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid('Invalid organization ID'),
    }),
});
const projectIdSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
// All routes require authentication
router.use(authenticate);
// Organization analytics
router.get('/organizations/:organizationId', validate(organizationIdSchema), analyticsController.getOrganizationAnalytics);
// Project analytics
router.get('/projects/:projectId', validate(projectIdSchema), analyticsController.getProjectAnalytics);
export default router;
//# sourceMappingURL=analytics.routes.js.map