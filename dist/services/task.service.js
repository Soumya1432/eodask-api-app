import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
export class TaskService {
    async create(userId, data) {
        // Get next task number for project
        const lastTask = await prisma.task.findFirst({
            where: { projectId: data.projectId },
            orderBy: { taskNumber: 'desc' },
            select: { taskNumber: true },
        });
        const taskNumber = (lastTask?.taskNumber ?? 0) + 1;
        // Get default column if not provided
        let columnId = data.columnId;
        if (!columnId) {
            const board = await prisma.board.findFirst({
                where: { projectId: data.projectId },
                include: {
                    columns: {
                        where: { status: data.status ?? 'TODO' },
                        take: 1,
                    },
                },
            });
            columnId = board?.columns[0]?.id;
        }
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status ?? 'TODO',
                priority: data.priority ?? 'MEDIUM',
                projectId: data.projectId,
                columnId,
                parentId: data.parentId,
                creatorId: userId,
                dueDate: data.dueDate,
                startDate: data.startDate,
                estimatedHours: data.estimatedHours,
                taskNumber,
                assignees: data.assigneeIds
                    ? {
                        create: data.assigneeIds.map((id) => ({ userId: id })),
                    }
                    : undefined,
                labels: data.labelIds
                    ? {
                        create: data.labelIds.map((id) => ({ labelId: id })),
                    }
                    : undefined,
            },
            include: this.getTaskInclude(),
        });
        // Create activity
        await this.createActivity(userId, task.id, 'CREATED', 'created the task');
        return task;
    }
    async findAll(projectId, filters) {
        const { status, priority, assigneeId, search, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const where = {
            projectId,
            parentId: null, // Only top-level tasks
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigneeId && { assignees: { some: { userId: assigneeId } } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: this.getTaskInclude(),
                orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
            }),
            prisma.task.count({ where }),
        ]);
        return { tasks, total };
    }
    async findByColumn(columnId) {
        const tasks = await prisma.task.findMany({
            where: { columnId, parentId: null },
            include: this.getTaskInclude(),
            orderBy: { order: 'asc' },
        });
        return tasks;
    }
    async findById(taskId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                ...this.getTaskInclude(),
                subtasks: {
                    include: this.getTaskInclude(),
                    orderBy: { order: 'asc' },
                },
                comments: {
                    where: { parentId: null },
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatar: true },
                        },
                        replies: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, avatar: true },
                                },
                            },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    include: {
                        uploadedBy: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                activities: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatar: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        return task;
    }
    async update(taskId, userId, data) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        // Track changes for activity
        const changes = [];
        if (data.status && data.status !== task.status) {
            changes.push(`status from ${task.status} to ${data.status}`);
        }
        if (data.priority && data.priority !== task.priority) {
            changes.push(`priority from ${task.priority} to ${data.priority}`);
        }
        if (data.title && data.title !== task.title) {
            changes.push('title');
        }
        const updated = await prisma.task.update({
            where: { id: taskId },
            data,
            include: this.getTaskInclude(),
        });
        // Create activity for changes
        if (changes.length > 0) {
            await this.createActivity(userId, taskId, data.status && data.status !== task.status ? 'STATUS_CHANGED' : 'UPDATED', `updated ${changes.join(', ')}`);
        }
        return updated;
    }
    async delete(taskId, userId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        await prisma.task.delete({
            where: { id: taskId },
        });
        // Create activity
        await prisma.activity.create({
            data: {
                type: 'DELETED',
                description: `deleted task "${task.title}"`,
                userId,
                metadata: { taskTitle: task.title, taskNumber: task.taskNumber },
            },
        });
    }
    async moveTask(taskId, userId, targetColumnId, order) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { column: true },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        const targetColumn = await prisma.boardColumn.findUnique({
            where: { id: targetColumnId },
        });
        if (!targetColumn) {
            throw ApiError.notFound('Target column not found');
        }
        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                columnId: targetColumnId,
                status: targetColumn.status,
                order,
            },
            include: this.getTaskInclude(),
        });
        // Create activity
        await this.createActivity(userId, taskId, 'MOVED', `moved task from ${task.column?.name ?? 'Unknown'} to ${targetColumn.name}`);
        return updated;
    }
    async assignUser(taskId, userId, assigneeId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        // Check if already assigned
        const existing = await prisma.taskAssignee.findUnique({
            where: {
                taskId_userId: { taskId, userId: assigneeId },
            },
        });
        if (existing) {
            throw ApiError.conflict('User already assigned to this task');
        }
        await prisma.taskAssignee.create({
            data: { taskId, userId: assigneeId },
        });
        const assignee = await prisma.user.findUnique({
            where: { id: assigneeId },
            select: { firstName: true, lastName: true },
        });
        // Create activity
        await this.createActivity(userId, taskId, 'ASSIGNED', `assigned ${assignee?.firstName} ${assignee?.lastName}`);
        // Create notification for assignee
        await prisma.notification.create({
            data: {
                type: 'TASK_ASSIGNED',
                title: 'New Task Assigned',
                message: `You have been assigned to task: ${task.title}`,
                userId: assigneeId,
                metadata: { taskId, taskTitle: task.title },
            },
        });
        return this.findById(taskId);
    }
    async unassignUser(taskId, userId, assigneeId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        await prisma.taskAssignee.delete({
            where: {
                taskId_userId: { taskId, userId: assigneeId },
            },
        });
        const assignee = await prisma.user.findUnique({
            where: { id: assigneeId },
            select: { firstName: true, lastName: true },
        });
        // Create activity
        await this.createActivity(userId, taskId, 'UNASSIGNED', `unassigned ${assignee?.firstName} ${assignee?.lastName}`);
        return this.findById(taskId);
    }
    async addComment(taskId, userId, content, parentId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId,
                parentId,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
        });
        // Create activity
        await this.createActivity(userId, taskId, 'COMMENTED', 'added a comment');
        return comment;
    }
    async updateComment(commentId, userId, content) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw ApiError.notFound('Comment not found');
        }
        if (comment.userId !== userId) {
            throw ApiError.forbidden('Can only edit own comments');
        }
        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
        });
        return updated;
    }
    async deleteComment(commentId, userId) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw ApiError.notFound('Comment not found');
        }
        if (comment.userId !== userId) {
            throw ApiError.forbidden('Can only delete own comments');
        }
        await prisma.comment.delete({
            where: { id: commentId },
        });
    }
    async getComments(taskId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        const comments = await prisma.comment.findMany({
            where: { taskId, parentId: null },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
                replies: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatar: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return comments;
    }
    async getActivity(taskId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        const activity = await prisma.activity.findMany({
            where: { taskId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return activity;
    }
    async createActivity(userId, taskId, type, description) {
        await prisma.activity.create({
            data: {
                type,
                description,
                taskId,
                userId,
            },
        });
    }
    getTaskInclude() {
        return {
            project: {
                select: { id: true, name: true, key: true },
            },
            column: {
                select: { id: true, name: true, status: true },
            },
            creator: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            assignees: {
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
                    },
                },
            },
            labels: {
                include: {
                    label: true,
                },
            },
            _count: {
                select: { subtasks: true, comments: true, attachments: true },
            },
        };
    }
}
export const taskService = new TaskService();
//# sourceMappingURL=task.service.js.map