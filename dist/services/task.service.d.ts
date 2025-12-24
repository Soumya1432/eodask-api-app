import type { TaskStatus, TaskPriority } from '@prisma/client';
interface CreateTaskData {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId: string;
    columnId?: string;
    parentId?: string;
    dueDate?: Date;
    startDate?: Date;
    estimatedHours?: number;
    assigneeIds?: string[];
    labelIds?: string[];
}
interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    columnId?: string;
    dueDate?: Date;
    startDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    order?: number;
}
export declare class TaskService {
    create(userId: string, data: CreateTaskData): Promise<{
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    }>;
    findAll(projectId: string, filters: {
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        tasks: ({
            project: {
                name: string;
                id: string;
                key: string;
            };
            labels: ({
                label: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    color: string;
                    projectId: string;
                };
            } & {
                id: string;
                taskId: string;
                labelId: string;
            })[];
            _count: {
                comments: number;
                attachments: number;
                subtasks: number;
            };
            column: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.TaskStatus;
            } | null;
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            assignees: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                userId: string;
                taskId: string;
                assignedAt: Date;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            startDate: Date | null;
            projectId: string;
            taskNumber: number;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            columnId: string | null;
            parentId: string | null;
            creatorId: string;
            dueDate: Date | null;
            estimatedHours: number | null;
            actualHours: number | null;
            order: number;
        })[];
        total: number;
    }>;
    findByColumn(columnId: string): Promise<({
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    })[]>;
    findById(taskId: string): Promise<{
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        comments: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            replies: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                taskId: string;
                parentId: string | null;
                content: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            taskId: string;
            parentId: string | null;
            content: string;
        })[];
        attachments: ({
            uploadedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            taskId: string;
            fileName: string;
            originalName: string;
            mimeType: string;
            size: number;
            url: string;
            uploadedById: string;
        })[];
        activities: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            description: string;
            userId: string;
            taskId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        subtasks: ({
            project: {
                name: string;
                id: string;
                key: string;
            };
            labels: ({
                label: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    color: string;
                    projectId: string;
                };
            } & {
                id: string;
                taskId: string;
                labelId: string;
            })[];
            _count: {
                comments: number;
                attachments: number;
                subtasks: number;
            };
            column: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.TaskStatus;
            } | null;
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            assignees: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                userId: string;
                taskId: string;
                assignedAt: Date;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            startDate: Date | null;
            projectId: string;
            taskNumber: number;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            columnId: string | null;
            parentId: string | null;
            creatorId: string;
            dueDate: Date | null;
            estimatedHours: number | null;
            actualHours: number | null;
            order: number;
        })[];
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    }>;
    update(taskId: string, userId: string, data: UpdateTaskData): Promise<{
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    }>;
    delete(taskId: string, userId: string): Promise<void>;
    moveTask(taskId: string, userId: string, targetColumnId: string, order: number): Promise<{
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    }>;
    assignUser(taskId: string, userId: string, assigneeId: string): Promise<{
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        comments: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            replies: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                taskId: string;
                parentId: string | null;
                content: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            taskId: string;
            parentId: string | null;
            content: string;
        })[];
        attachments: ({
            uploadedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            taskId: string;
            fileName: string;
            originalName: string;
            mimeType: string;
            size: number;
            url: string;
            uploadedById: string;
        })[];
        activities: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            description: string;
            userId: string;
            taskId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        subtasks: ({
            project: {
                name: string;
                id: string;
                key: string;
            };
            labels: ({
                label: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    color: string;
                    projectId: string;
                };
            } & {
                id: string;
                taskId: string;
                labelId: string;
            })[];
            _count: {
                comments: number;
                attachments: number;
                subtasks: number;
            };
            column: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.TaskStatus;
            } | null;
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            assignees: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                userId: string;
                taskId: string;
                assignedAt: Date;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            startDate: Date | null;
            projectId: string;
            taskNumber: number;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            columnId: string | null;
            parentId: string | null;
            creatorId: string;
            dueDate: Date | null;
            estimatedHours: number | null;
            actualHours: number | null;
            order: number;
        })[];
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    }>;
    unassignUser(taskId: string, userId: string, assigneeId: string): Promise<{
        project: {
            name: string;
            id: string;
            key: string;
        };
        labels: ({
            label: {
                name: string;
                id: string;
                createdAt: Date;
                color: string;
                projectId: string;
            };
        } & {
            id: string;
            taskId: string;
            labelId: string;
        })[];
        _count: {
            comments: number;
            attachments: number;
            subtasks: number;
        };
        comments: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            replies: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                taskId: string;
                parentId: string | null;
                content: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            taskId: string;
            parentId: string | null;
            content: string;
        })[];
        attachments: ({
            uploadedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            taskId: string;
            fileName: string;
            originalName: string;
            mimeType: string;
            size: number;
            url: string;
            uploadedById: string;
        })[];
        activities: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            description: string;
            userId: string;
            taskId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        column: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        subtasks: ({
            project: {
                name: string;
                id: string;
                key: string;
            };
            labels: ({
                label: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    color: string;
                    projectId: string;
                };
            } & {
                id: string;
                taskId: string;
                labelId: string;
            })[];
            _count: {
                comments: number;
                attachments: number;
                subtasks: number;
            };
            column: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.TaskStatus;
            } | null;
            creator: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            assignees: ({
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                };
            } & {
                id: string;
                userId: string;
                taskId: string;
                assignedAt: Date;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            startDate: Date | null;
            projectId: string;
            taskNumber: number;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            columnId: string | null;
            parentId: string | null;
            creatorId: string;
            dueDate: Date | null;
            estimatedHours: number | null;
            actualHours: number | null;
            order: number;
        })[];
        creator: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        assignees: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        startDate: Date | null;
        projectId: string;
        taskNumber: number;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        columnId: string | null;
        parentId: string | null;
        creatorId: string;
        dueDate: Date | null;
        estimatedHours: number | null;
        actualHours: number | null;
        order: number;
    }>;
    addComment(taskId: string, userId: string, content: string, parentId?: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        taskId: string;
        parentId: string | null;
        content: string;
    }>;
    updateComment(commentId: string, userId: string, content: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        taskId: string;
        parentId: string | null;
        content: string;
    }>;
    deleteComment(commentId: string, userId: string): Promise<void>;
    getComments(taskId: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        replies: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            taskId: string;
            parentId: string | null;
            content: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        taskId: string;
        parentId: string | null;
        content: string;
    })[]>;
    getActivity(taskId: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        taskId: string | null;
        type: import("@prisma/client").$Enums.ActivityType;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    private createActivity;
    private getTaskInclude;
}
export declare const taskService: TaskService;
export {};
//# sourceMappingURL=task.service.d.ts.map