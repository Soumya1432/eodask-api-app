import type { ProjectStatus, Role } from '@prisma/client';
interface CreateProjectData {
    name: string;
    description?: string;
    key: string;
    color?: string;
    startDate?: Date;
    endDate?: Date;
    organizationId: string;
}
interface UpdateProjectData {
    name?: string;
    description?: string;
    color?: string;
    status?: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
}
export declare class ProjectService {
    create(userId: string, data: CreateProjectData): Promise<{
        owner: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            projectId: string;
            userId: string;
            role: import("@prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
        boards: ({
            columns: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                color: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                order: number;
                boardId: string;
                wipLimit: number | null;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            order: number;
        })[];
        labels: {
            name: string;
            id: string;
            createdAt: Date;
            color: string;
            projectId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        key: string;
        color: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        startDate: Date | null;
        endDate: Date | null;
        ownerId: string;
        organizationId: string;
    }>;
    findAll(userId: string, page?: number, limit?: number): Promise<{
        projects: ({
            owner: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            _count: {
                members: number;
                tasks: number;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            key: string;
            color: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            startDate: Date | null;
            endDate: Date | null;
            ownerId: string;
            organizationId: string;
        })[];
        total: number;
    }>;
    findById(projectId: string, userId: string): Promise<{
        owner: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            projectId: string;
            userId: string;
            role: import("@prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
        boards: ({
            columns: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                color: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                order: number;
                boardId: string;
                wipLimit: number | null;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            order: number;
        })[];
        labels: {
            name: string;
            id: string;
            createdAt: Date;
            color: string;
            projectId: string;
        }[];
        _count: {
            tasks: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        key: string;
        color: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        startDate: Date | null;
        endDate: Date | null;
        ownerId: string;
        organizationId: string;
    }>;
    update(projectId: string, userId: string, data: UpdateProjectData): Promise<{
        owner: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            projectId: string;
            userId: string;
            role: import("@prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        key: string;
        color: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        startDate: Date | null;
        endDate: Date | null;
        ownerId: string;
        organizationId: string;
    }>;
    delete(projectId: string, userId: string): Promise<void>;
    addMember(projectId: string, userId: string, memberEmail: string, role: Role): Promise<{
        type: string;
        invitation: {
            project: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.InvitationStatus;
            projectId: string;
            role: import("@prisma/client").$Enums.Role;
            token: string;
            senderId: string;
            expiresAt: Date;
        };
        message: string;
        member?: undefined;
    } | {
        type: string;
        member: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
        } & {
            id: string;
            projectId: string;
            userId: string;
            role: import("@prisma/client").$Enums.Role;
            joinedAt: Date;
        };
        message: string;
        invitation?: undefined;
    }>;
    removeMember(projectId: string, userId: string, memberId: string): Promise<void>;
    updateMemberRole(projectId: string, userId: string, memberId: string, role: Role): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        projectId: string;
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        joinedAt: Date;
    }>;
    getMembers(projectId: string, userId: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        projectId: string;
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        joinedAt: Date;
    })[]>;
    getColumns(projectId: string, userId: string): Promise<{
        projectId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        boardId: string;
        wipLimit: number | null;
    }[]>;
    createColumn(projectId: string, userId: string, data: {
        name: string;
        order?: number;
    }): Promise<{
        projectId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        boardId: string;
        wipLimit: number | null;
    }>;
    updateColumn(projectId: string, userId: string, columnId: string, data: {
        name?: string;
        order?: number;
    }): Promise<{
        projectId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        boardId: string;
        wipLimit: number | null;
    }>;
    deleteColumn(projectId: string, userId: string, columnId: string): Promise<void>;
    reorderColumns(projectId: string, userId: string, columnOrders: {
        id: string;
        order: number;
    }[]): Promise<{
        projectId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        boardId: string;
        wipLimit: number | null;
    }[]>;
    getStats(projectId: string): Promise<{
        tasksByStatus: Record<import("@prisma/client").$Enums.TaskStatus, number>;
        tasksByPriority: Record<string, number>;
        recentActivity: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            task: {
                id: string;
                taskNumber: number;
                title: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            description: string;
            userId: string;
            taskId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
}
export declare const projectService: ProjectService;
export {};
//# sourceMappingURL=project.service.d.ts.map