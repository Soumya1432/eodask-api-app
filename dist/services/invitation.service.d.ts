import type { Role } from '@prisma/client';
export declare class InvitationService {
    createInvitation(projectId: string, senderId: string, email: string, role: Role): Promise<{
        project: {
            name: string;
        };
        sender: {
            firstName: string;
            lastName: string;
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
    }>;
    acceptInvitation(token: string, userId: string): Promise<{
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
    rejectInvitation(token: string): Promise<void>;
    getInvitationByToken(token: string): Promise<{
        project: {
            name: string;
            id: string;
        };
        sender: {
            firstName: string;
            lastName: string;
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
    }>;
    getProjectInvitations(projectId: string): Promise<({
        sender: {
            firstName: string;
            lastName: string;
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
    })[]>;
    cancelInvitation(invitationId: string, userId: string): Promise<void>;
}
export declare const invitationService: InvitationService;
//# sourceMappingURL=invitation.service.d.ts.map