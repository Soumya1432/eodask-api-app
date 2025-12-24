import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireProjectRole } from '../middleware/rbac.js';
import * as projectController from '../controllers/project.controller.js';
const router = Router();
const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Project name is required').max(100),
        description: z.string().max(1000).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
        organizationId: z.string().uuid('Invalid organization ID'),
    }),
});
const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
        isArchived: z.boolean().optional(),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const projectIdSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const addMemberSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const updateMemberRoleSchema = z.object({
    body: z.object({
        role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        userId: z.string().uuid('Invalid user ID'),
    }),
});
const removeMemberSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        userId: z.string().uuid('Invalid user ID'),
    }),
});
const columnSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Column name is required').max(50),
        order: z.number().int().min(0).optional(),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const updateColumnSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        order: z.number().int().min(0).optional(),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        columnId: z.string().uuid('Invalid column ID'),
    }),
});
const reorderColumnsSchema = z.object({
    body: z.object({
        columnOrders: z.array(z.object({
            id: z.string().uuid(),
            order: z.number().int().min(0),
        })),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
// All routes require authentication
router.use(authenticate);
// Project CRUD
router.get('/', projectController.getProjects);
router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/:projectId', validate(projectIdSchema), projectController.getProject);
router.patch('/:projectId', validate(updateProjectSchema), requireProjectRole('ADMIN'), projectController.updateProject);
router.delete('/:projectId', validate(projectIdSchema), requireProjectRole('ADMIN'), projectController.deleteProject);
// Member management
router.get('/:projectId/members', validate(projectIdSchema), projectController.getMembers);
router.post('/:projectId/members', validate(addMemberSchema), requireProjectRole('ADMIN', 'MANAGER'), projectController.addMember);
router.patch('/:projectId/members/:userId', validate(updateMemberRoleSchema), requireProjectRole('ADMIN'), projectController.updateMemberRole);
router.delete('/:projectId/members/:userId', validate(removeMemberSchema), requireProjectRole('ADMIN', 'MANAGER'), projectController.removeMember);
// Board columns
router.get('/:projectId/columns', validate(projectIdSchema), projectController.getColumns);
router.post('/:projectId/columns', validate(columnSchema), requireProjectRole('ADMIN', 'MANAGER'), projectController.createColumn);
router.patch('/:projectId/columns/:columnId', validate(updateColumnSchema), requireProjectRole('ADMIN', 'MANAGER'), projectController.updateColumn);
router.delete('/:projectId/columns/:columnId', validate(projectIdSchema), requireProjectRole('ADMIN', 'MANAGER'), projectController.deleteColumn);
router.put('/:projectId/columns/reorder', validate(reorderColumnsSchema), requireProjectRole('ADMIN', 'MANAGER'), projectController.reorderColumns);
export default router;
//# sourceMappingURL=project.routes.js.map