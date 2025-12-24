import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { emailService } from './email.service.js';
export class InvitationService {
    async createInvitation(projectId, senderId, email, role) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw ApiError.notFound('Project not found');
        }
        // Check if user is already a member
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            const existingMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: existingUser.id,
                    },
                },
            });
            if (existingMember) {
                throw ApiError.conflict('User is already a member of this project');
            }
        }
        // Check for existing pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email,
                projectId,
                status: 'PENDING',
            },
        });
        if (existingInvitation) {
            throw ApiError.conflict('Invitation already sent to this email');
        }
        const sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: { firstName: true, lastName: true },
        });
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const invitation = await prisma.invitation.create({
            data: {
                email,
                projectId,
                role,
                token,
                senderId,
                expiresAt,
            },
            include: {
                project: { select: { name: true } },
                sender: { select: { firstName: true, lastName: true } },
            },
        });
        // Send email
        await emailService.sendInvitation(email, project.name, `${sender?.firstName} ${sender?.lastName}`, token);
        return invitation;
    }
    async acceptInvitation(token, userId) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                project: true,
            },
        });
        if (!invitation) {
            throw ApiError.notFound('Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw ApiError.badRequest('Invitation is no longer valid');
        }
        if (invitation.expiresAt < new Date()) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' },
            });
            throw ApiError.badRequest('Invitation has expired');
        }
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        // Check if email matches
        if (user.email !== invitation.email) {
            throw ApiError.forbidden('This invitation was sent to a different email');
        }
        // Add user to project
        await prisma.$transaction([
            prisma.projectMember.create({
                data: {
                    projectId: invitation.projectId,
                    userId,
                    role: invitation.role,
                },
            }),
            prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' },
            }),
        ]);
        return invitation.project;
    }
    async rejectInvitation(token) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
        });
        if (!invitation) {
            throw ApiError.notFound('Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw ApiError.badRequest('Invitation is no longer valid');
        }
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'REJECTED' },
        });
    }
    async getInvitationByToken(token) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                project: { select: { id: true, name: true } },
                sender: { select: { firstName: true, lastName: true } },
            },
        });
        if (!invitation) {
            throw ApiError.notFound('Invitation not found');
        }
        return invitation;
    }
    async getProjectInvitations(projectId) {
        const invitations = await prisma.invitation.findMany({
            where: { projectId },
            include: {
                sender: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return invitations;
    }
    async cancelInvitation(invitationId, userId) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                project: true,
            },
        });
        if (!invitation) {
            throw ApiError.notFound('Invitation not found');
        }
        // Check if user is project owner or admin
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId: invitation.projectId,
                    userId,
                },
            },
        });
        if (invitation.project.ownerId !== userId &&
            member?.role !== 'ADMIN') {
            throw ApiError.forbidden('Only project owner or admin can cancel invitations');
        }
        await prisma.invitation.delete({
            where: { id: invitationId },
        });
    }
}
export const invitationService = new InvitationService();
//# sourceMappingURL=invitation.service.js.map