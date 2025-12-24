import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireProjectRole } from '../middleware/rbac.js';
import * as taskController from '../controllers/task.controller.js';
const router = Router();
const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200),
        description: z.string().max(5000).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        dueDate: z.string().datetime().optional(),
        columnId: z.string().uuid('Invalid column ID'),
        assigneeIds: z.array(z.string().uuid()).optional(),
        labels: z.array(z.string()).optional(),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
});
const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
        dueDate: z.string().datetime().nullable().optional(),
        columnId: z.string().uuid().optional(),
        order: z.number().int().min(0).optional(),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});
const taskIdSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});
const moveTaskSchema = z.object({
    body: z.object({
        columnId: z.string().uuid('Invalid column ID'),
        order: z.number().int().min(0),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});
const assigneeSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});
const removeAssigneeSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
        userId: z.string().uuid('Invalid user ID'),
    }),
});
const commentSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'Comment content is required').max(2000),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});
const updateCommentSchema = z.object({
    body: z.object({
        content: z.string().min(1).max(2000),
    }),
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
        commentId: z.string().uuid('Invalid comment ID'),
    }),
});
const deleteCommentSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
        commentId: z.string().uuid('Invalid comment ID'),
    }),
});
const listTasksSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID'),
    }),
    query: z.object({
        status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        assigneeId: z.string().uuid().optional(),
        search: z.string().optional(),
        columnId: z.string().uuid().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
    }).optional(),
});
// All routes require authentication
router.use(authenticate);
// Task CRUD
router.get('/:projectId/tasks', validate(listTasksSchema), taskController.getTasks);
router.post('/:projectId/tasks', validate(createTaskSchema), requireProjectRole('ADMIN', 'MANAGER', 'MEMBER'), taskController.createTask);
router.get('/:projectId/tasks/:taskId', validate(taskIdSchema), taskController.getTask);
router.patch('/:projectId/tasks/:taskId', validate(updateTaskSchema), requireProjectRole('ADMIN', 'MANAGER', 'MEMBER'), taskController.updateTask);
router.delete('/:projectId/tasks/:taskId', validate(taskIdSchema), requireProjectRole('ADMIN', 'MANAGER'), taskController.deleteTask);
// Task movement (Kanban)
router.put('/:projectId/tasks/:taskId/move', validate(moveTaskSchema), requireProjectRole('ADMIN', 'MANAGER', 'MEMBER'), taskController.moveTask);
// Assignees
router.post('/:projectId/tasks/:taskId/assignees', validate(assigneeSchema), requireProjectRole('ADMIN', 'MANAGER'), taskController.addAssignee);
router.delete('/:projectId/tasks/:taskId/assignees/:userId', validate(removeAssigneeSchema), requireProjectRole('ADMIN', 'MANAGER'), taskController.removeAssignee);
// Comments
router.get('/:projectId/tasks/:taskId/comments', validate(taskIdSchema), taskController.getComments);
router.post('/:projectId/tasks/:taskId/comments', validate(commentSchema), requireProjectRole('ADMIN', 'MANAGER', 'MEMBER'), taskController.addComment);
router.patch('/:projectId/tasks/:taskId/comments/:commentId', validate(updateCommentSchema), requireProjectRole('ADMIN', 'MANAGER', 'MEMBER'), taskController.updateComment);
router.delete('/:projectId/tasks/:taskId/comments/:commentId', validate(deleteCommentSchema), requireProjectRole('ADMIN', 'MANAGER', 'MEMBER'), taskController.deleteComment);
// Activity log
router.get('/:projectId/tasks/:taskId/activity', validate(taskIdSchema), taskController.getActivity);
export default router;
//# sourceMappingURL=task.routes.js.map