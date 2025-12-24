import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireProjectRole } from '../middleware/rbac.js';
import * as invitationController from '../controllers/invitation.controller.js';
const router = Router();
const createInvitationSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const tokenSchema = z.object({
    params: z.object({
        token: z.string().min(1, 'Token is required'),
    }),
});
const projectIdSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const invitationIdSchema = z.object({
    params: z.object({
        invitationId: z.string().uuid('Invalid invitation ID'),
    }),
});
// Public routes (token-based)
router.get('/token/:token', validate(tokenSchema), invitationController.getInvitation);
// Protected routes
router.use(authenticate);
// Accept/reject invitation
router.post('/token/:token/accept', validate(tokenSchema), invitationController.acceptInvitation);
router.post('/token/:token/reject', validate(tokenSchema), invitationController.rejectInvitation);
// Project invitation management
router.get('/project/:projectId', validate(projectIdSchema), requireProjectRole('ADMIN', 'MANAGER'), invitationController.getProjectInvitations);
router.post('/project/:projectId', validate(createInvitationSchema), requireProjectRole('ADMIN', 'MANAGER'), invitationController.createInvitation);
router.delete('/:invitationId', validate(invitationIdSchema), invitationController.cancelInvitation);
export default router;
//# sourceMappingURL=invitation.routes.js.map