import type { OrganizationRole } from '@prisma/client';
interface CreateOrganizationData {
    name: string;
    slug?: string;
    description?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
}
interface UpdateOrganizationData {
    name?: string;
    description?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
}
interface UpdateSettingsData {
    allowMemberInvites?: boolean;
    defaultProjectRole?: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
    requireApprovalToJoin?: boolean;
}
export declare class OrganizationService {
    getRoleLevel(role: OrganizationRole): number;
    hasMinRole(userRole: OrganizationRole, minRole: OrganizationRole): boolean;
    create(userId: string, data: CreateOrganizationData): Promise<{
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
            organizationId: string;
            userId: string;
            role: import("@prisma/client").$Enums.OrganizationRole;
            joinedAt: Date;
            title: string | null;
            department: string | null;
        })[];
        _count: {
            members: number;
            projects: number;
        };
        settings: {
            id: string;
            organizationId: string;
            allowMemberInvites: boolean;
            defaultProjectRole: import("@prisma/client").$Enums.Role;
            requireApprovalToJoin: boolean;
        } | null;
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
    findAll(userId: string): Promise<{
        role: import("@prisma/client").$Enums.OrganizationRole;
        members: undefined;
        _count: {
            members: number;
            projects: number;
        };
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }[]>;
    findById(orgId: string, userId: string): Promise<{
        userRole: import("@prisma/client").$Enums.OrganizationRole;
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
            organizationId: string;
            userId: string;
            role: import("@prisma/client").$Enums.OrganizationRole;
            joinedAt: Date;
            title: string | null;
            department: string | null;
        })[];
        _count: {
            members: number;
            projects: number;
        };
        settings: {
            id: string;
            organizationId: string;
            allowMemberInvites: boolean;
            defaultProjectRole: import("@prisma/client").$Enums.Role;
            requireApprovalToJoin: boolean;
        } | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
    findBySlug(slug: string, userId: string): Promise<{
        userRole: import("@prisma/client").$Enums.OrganizationRole;
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
            organizationId: string;
            userId: string;
            role: import("@prisma/client").$Enums.OrganizationRole;
            joinedAt: Date;
            title: string | null;
            department: string | null;
        })[];
        _count: {
            members: number;
            projects: number;
        };
        settings: {
            id: string;
            organizationId: string;
            allowMemberInvites: boolean;
            defaultProjectRole: import("@prisma/client").$Enums.Role;
            requireApprovalToJoin: boolean;
        } | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
    update(orgId: string, userId: string, data: UpdateOrganizationData): Promise<{
        _count: {
            members: number;
            projects: number;
        };
        settings: {
            id: string;
            organizationId: string;
            allowMemberInvites: boolean;
            defaultProjectRole: import("@prisma/client").$Enums.Role;
            requireApprovalToJoin: boolean;
        } | null;
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
    updateSlug(orgId: string, userId: string, newSlug: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
    delete(orgId: string, userId: string): Promise<void>;
    updateSettings(orgId: string, userId: string, data: UpdateSettingsData): Promise<{
        id: string;
        organizationId: string;
        allowMemberInvites: boolean;
        defaultProjectRole: import("@prisma/client").$Enums.Role;
        requireApprovalToJoin: boolean;
    }>;
    uploadLogo(orgId: string, userId: string, logoUrl: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
    getMembers(orgId: string, userId: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        joinedAt: Date;
        title: string | null;
        department: string | null;
    })[]>;
    addMember(orgId: string, userId: string, memberEmail: string, role: OrganizationRole): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        joinedAt: Date;
        title: string | null;
        department: string | null;
    }>;
    updateMemberRole(orgId: string, userId: string, memberId: string, role: OrganizationRole): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        joinedAt: Date;
        title: string | null;
        department: string | null;
    }>;
    removeMember(orgId: string, userId: string, memberId: string): Promise<void>;
    transferOwnership(orgId: string, userId: string, newOwnerId: string): Promise<void>;
    createInvitation(orgId: string, userId: string, email: string, role?: OrganizationRole): Promise<{
        organization: {
            name: string;
            id: string;
            slug: string;
        };
        sender: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        email: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InvitationStatus;
        organizationId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        token: string;
        senderId: string;
        expiresAt: Date;
    }>;
    getInvitations(orgId: string, userId: string): Promise<({
        sender: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        email: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InvitationStatus;
        organizationId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        token: string;
        senderId: string;
        expiresAt: Date;
    })[]>;
    cancelInvitation(orgId: string, userId: string, invitationId: string): Promise<void>;
    getInvitationByToken(token: string): Promise<{
        organization: {
            name: string;
            id: string;
            slug: string;
            logo: string | null;
        };
        sender: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        email: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InvitationStatus;
        organizationId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        token: string;
        senderId: string;
        expiresAt: Date;
    }>;
    acceptInvitation(token: string, userId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        organization: {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            size: string | null;
            slug: string;
            logo: string | null;
            website: string | null;
            industry: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import("@prisma/client").$Enums.OrganizationRole;
        joinedAt: Date;
        title: string | null;
        department: string | null;
    }>;
    rejectInvitation(token: string, userId: string): Promise<void>;
    getDashboardStats(orgId: string, userId: string): Promise<{
        projectCount: number;
        memberCount: number;
        totalTasks: number;
        completedTasks: number;
        tasksByStatus: Record<string, number>;
        recentActivity: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string | null;
            };
            task: {
                id: string;
                project: {
                    key: string;
                };
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
        recentProjects: ({
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
    }>;
    getProjects(orgId: string, userId: string, page?: number, limit?: number): Promise<{
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
    userNeedsOrganization(userId: string): Promise<boolean>;
    switchOrganization(userId: string, orgId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        size: string | null;
        slug: string;
        logo: string | null;
        website: string | null;
        industry: string | null;
    }>;
}
export declare const organizationService: OrganizationService;
export {};
//# sourceMappingURL=organization.service.d.ts.map