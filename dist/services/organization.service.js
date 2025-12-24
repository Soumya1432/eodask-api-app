import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { emailService } from './email.service.js';
// Organization role hierarchy (lowest to highest)
const ORG_ROLE_HIERARCHY = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
const MAX_OWNED_ORGANIZATIONS = 3;
// Generate URL-friendly slug from name
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
};
// Generate unique slug by appending number if needed
const generateUniqueSlug = async (baseName, excludeId) => {
    let slug = generateSlug(baseName);
    let counter = 1;
    while (true) {
        const existing = await prisma.organization.findUnique({
            where: { slug },
        });
        if (!existing || existing.id === excludeId) {
            return slug;
        }
        slug = `${generateSlug(baseName)}-${counter}`;
        counter++;
    }
};
export class OrganizationService {
    // Get role level for comparison
    getRoleLevel(role) {
        return ORG_ROLE_HIERARCHY.indexOf(role);
    }
    // Check if user has minimum role level
    hasMinRole(userRole, minRole) {
        return this.getRoleLevel(userRole) >= this.getRoleLevel(minRole);
    }
    async create(userId, data) {
        // Check if user has reached max owned organizations
        const ownedCount = await prisma.organizationMember.count({
            where: {
                userId,
                role: 'OWNER',
            },
        });
        if (ownedCount >= MAX_OWNED_ORGANIZATIONS) {
            throw ApiError.badRequest(`You can only create up to ${MAX_OWNED_ORGANIZATIONS} organizations`);
        }
        // Generate unique slug
        const slug = data.slug
            ? await generateUniqueSlug(data.slug)
            : await generateUniqueSlug(data.name);
        const organization = await prisma.organization.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                logo: data.logo,
                website: data.website,
                industry: data.industry,
                size: data.size,
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                    },
                },
                settings: {
                    create: {
                        allowMemberInvites: false,
                        defaultProjectRole: 'MEMBER',
                        requireApprovalToJoin: false,
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                        },
                    },
                },
                settings: true,
                _count: {
                    select: { projects: true, members: true },
                },
            },
        });
        // Update user's current organization
        await prisma.user.update({
            where: { id: userId },
            data: { currentOrganizationId: organization.id },
        });
        return organization;
    }
    async findAll(userId) {
        const organizations = await prisma.organization.findMany({
            where: {
                members: { some: { userId } },
                isActive: true,
            },
            include: {
                members: {
                    where: { userId },
                    select: { role: true },
                },
                _count: {
                    select: { projects: true, members: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        // Transform to include user's role at top level
        return organizations.map((org) => ({
            ...org,
            role: org.members[0]?.role || 'GUEST',
            members: undefined, // Remove members array
        }));
    }
    async findById(orgId, userId) {
        const organization = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                        },
                    },
                },
                settings: true,
                _count: {
                    select: { projects: true, members: true },
                },
            },
        });
        if (!organization) {
            throw ApiError.notFound('Organization not found');
        }
        // Check membership
        const membership = organization.members.find((m) => m.userId === userId);
        if (!membership) {
            throw ApiError.forbidden('Not a member of this organization');
        }
        return { ...organization, userRole: membership.role };
    }
    async findBySlug(slug, userId) {
        const organization = await prisma.organization.findUnique({
            where: { slug },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                        },
                    },
                },
                settings: true,
                _count: {
                    select: { projects: true, members: true },
                },
            },
        });
        if (!organization) {
            throw ApiError.notFound('Organization not found');
        }
        // Check membership
        const membership = organization.members.find((m) => m.userId === userId);
        if (!membership) {
            throw ApiError.forbidden('Not a member of this organization');
        }
        return { ...organization, userRole: membership.role };
    }
    async update(orgId, userId, data) {
        const org = await this.findById(orgId, userId);
        // Check if user is admin or owner
        if (!this.hasMinRole(org.userRole, 'ADMIN')) {
            throw ApiError.forbidden('Only admins can update organization');
        }
        const updated = await prisma.organization.update({
            where: { id: orgId },
            data,
            include: {
                settings: true,
                _count: {
                    select: { projects: true, members: true },
                },
            },
        });
        return updated;
    }
    async updateSlug(orgId, userId, newSlug) {
        const org = await this.findById(orgId, userId);
        // Only owner can change slug
        if (org.userRole !== 'OWNER') {
            throw ApiError.forbidden('Only organization owner can change slug');
        }
        const slug = await generateUniqueSlug(newSlug, orgId);
        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: { slug },
        });
        return updated;
    }
    async delete(orgId, userId) {
        const org = await this.findById(orgId, userId);
        // Only owner can delete
        if (org.userRole !== 'OWNER') {
            throw ApiError.forbidden('Only organization owner can delete organization');
        }
        // Check if there are projects
        if (org._count.projects > 0) {
            throw ApiError.badRequest('Cannot delete organization with projects. Delete all projects first.');
        }
        await prisma.organization.delete({
            where: { id: orgId },
        });
    }
    async updateSettings(orgId, userId, data) {
        const org = await this.findById(orgId, userId);
        // Check if user is admin or owner
        if (!this.hasMinRole(org.userRole, 'ADMIN')) {
            throw ApiError.forbidden('Only admins can update organization settings');
        }
        const settings = await prisma.organizationSettings.upsert({
            where: { organizationId: orgId },
            update: data,
            create: {
                organizationId: orgId,
                ...data,
            },
        });
        return settings;
    }
    async uploadLogo(orgId, userId, logoUrl) {
        const org = await this.findById(orgId, userId);
        // Check if user is admin or owner
        if (!this.hasMinRole(org.userRole, 'ADMIN')) {
            throw ApiError.forbidden('Only admins can update organization logo');
        }
        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: { logo: logoUrl },
        });
        return updated;
    }
    // Member management
    async getMembers(orgId, userId) {
        await this.findById(orgId, userId);
        const members = await prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                },
            },
            orderBy: [
                { role: 'asc' }, // Owner first, then Admin, etc.
                { joinedAt: 'asc' },
            ],
        });
        return members;
    }
    async addMember(orgId, userId, memberEmail, role) {
        const org = await this.findById(orgId, userId);
        // Check if user can add members (admin+ or member if allowed)
        const canAdd = this.hasMinRole(org.userRole, 'ADMIN') ||
            (this.hasMinRole(org.userRole, 'MEMBER') && org.settings?.allowMemberInvites);
        if (!canAdd) {
            throw ApiError.forbidden('Not authorized to add members');
        }
        // Can't add someone as OWNER
        if (role === 'OWNER') {
            throw ApiError.badRequest('Cannot add member as owner. Use transfer ownership.');
        }
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: memberEmail },
        });
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        // Check if already a member
        const existingMember = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId: user.id,
                },
            },
        });
        if (existingMember) {
            throw ApiError.conflict('User is already a member of this organization');
        }
        const member = await prisma.organizationMember.create({
            data: {
                organizationId: orgId,
                userId: user.id,
                role,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                },
            },
        });
        return member;
    }
    async updateMemberRole(orgId, userId, memberId, role) {
        const org = await this.findById(orgId, userId);
        // Only owner can change roles
        if (org.userRole !== 'OWNER') {
            throw ApiError.forbidden('Only organization owner can change member roles');
        }
        // Can't change own role or set someone as owner
        if (memberId === userId) {
            throw ApiError.badRequest('Cannot change your own role');
        }
        if (role === 'OWNER') {
            throw ApiError.badRequest('Use transfer ownership to make someone owner');
        }
        const member = await prisma.organizationMember.update({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId: memberId,
                },
            },
            data: { role },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
                },
            },
        });
        return member;
    }
    async removeMember(orgId, userId, memberId) {
        const org = await this.findById(orgId, userId);
        // Check if target is owner
        const targetMember = org.members.find((m) => m.userId === memberId);
        if (targetMember?.role === 'OWNER') {
            throw ApiError.badRequest('Cannot remove organization owner');
        }
        // User can remove themselves, or admin+ can remove others
        const canRemove = memberId === userId || this.hasMinRole(org.userRole, 'ADMIN');
        if (!canRemove) {
            throw ApiError.forbidden('Not authorized to remove members');
        }
        await prisma.organizationMember.delete({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId: memberId,
                },
            },
        });
        // If user left, clear their current organization
        if (memberId === userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { currentOrganizationId: null },
            });
        }
    }
    async transferOwnership(orgId, userId, newOwnerId) {
        const org = await this.findById(orgId, userId);
        if (org.userRole !== 'OWNER') {
            throw ApiError.forbidden('Only organization owner can transfer ownership');
        }
        if (newOwnerId === userId) {
            throw ApiError.badRequest('You are already the owner');
        }
        // Check if new owner is a member
        const newOwnerMember = org.members.find((m) => m.userId === newOwnerId);
        if (!newOwnerMember) {
            throw ApiError.badRequest('New owner must be a member of the organization');
        }
        // Transfer ownership in transaction
        await prisma.$transaction([
            // Make new owner
            prisma.organizationMember.update({
                where: {
                    organizationId_userId: {
                        organizationId: orgId,
                        userId: newOwnerId,
                    },
                },
                data: { role: 'OWNER' },
            }),
            // Demote current owner to admin
            prisma.organizationMember.update({
                where: {
                    organizationId_userId: {
                        organizationId: orgId,
                        userId,
                    },
                },
                data: { role: 'ADMIN' },
            }),
        ]);
    }
    // Invitation management
    async createInvitation(orgId, userId, email, role = 'MEMBER') {
        const org = await this.findById(orgId, userId);
        // Check if user can invite
        const canInvite = this.hasMinRole(org.userRole, 'ADMIN') ||
            (this.hasMinRole(org.userRole, 'MEMBER') && org.settings?.allowMemberInvites);
        if (!canInvite) {
            throw ApiError.forbidden('Not authorized to send invitations');
        }
        if (role === 'OWNER') {
            throw ApiError.badRequest('Cannot invite as owner');
        }
        // Check if user is already a member
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            const existingMember = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: orgId,
                        userId: existingUser.id,
                    },
                },
            });
            if (existingMember) {
                throw ApiError.conflict('User is already a member');
            }
        }
        // Check for existing pending invitation
        const existingInvitation = await prisma.organizationInvitation.findFirst({
            where: {
                email,
                organizationId: orgId,
                status: 'PENDING',
            },
        });
        if (existingInvitation) {
            throw ApiError.conflict('Invitation already sent to this email');
        }
        const invitation = await prisma.organizationInvitation.create({
            data: {
                email,
                organizationId: orgId,
                role,
                senderId: userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true },
                },
                sender: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        // Send invitation email
        const senderName = `${invitation.sender.firstName} ${invitation.sender.lastName}`;
        await emailService.sendOrganizationInvitation(email, invitation.organization.name, senderName, role, invitation.token);
        return invitation;
    }
    async getInvitations(orgId, userId) {
        const org = await this.findById(orgId, userId);
        if (!this.hasMinRole(org.userRole, 'MANAGER')) {
            throw ApiError.forbidden('Not authorized to view invitations');
        }
        const invitations = await prisma.organizationInvitation.findMany({
            where: { organizationId: orgId },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return invitations;
    }
    async cancelInvitation(orgId, userId, invitationId) {
        const org = await this.findById(orgId, userId);
        if (!this.hasMinRole(org.userRole, 'ADMIN')) {
            throw ApiError.forbidden('Not authorized to cancel invitations');
        }
        const invitation = await prisma.organizationInvitation.findUnique({
            where: { id: invitationId },
        });
        if (!invitation || invitation.organizationId !== orgId) {
            throw ApiError.notFound('Invitation not found');
        }
        await prisma.organizationInvitation.delete({
            where: { id: invitationId },
        });
    }
    async getInvitationByToken(token) {
        const invitation = await prisma.organizationInvitation.findUnique({
            where: { token },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true, logo: true },
                },
                sender: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
        if (!invitation) {
            throw ApiError.notFound('Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw ApiError.badRequest('Invitation is no longer valid');
        }
        if (invitation.expiresAt < new Date()) {
            await prisma.organizationInvitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' },
            });
            throw ApiError.badRequest('Invitation has expired');
        }
        return invitation;
    }
    async acceptInvitation(token, userId) {
        const invitation = await this.getInvitationByToken(token);
        // Check if user email matches invitation
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (user?.email !== invitation.email) {
            throw ApiError.forbidden(`This invitation was sent to ${invitation.email}. Please log in with that email address to accept the invitation.`);
        }
        // Check if already a member
        const existingMember = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: invitation.organizationId,
                    userId,
                },
            },
        });
        if (existingMember) {
            // Update invitation status
            await prisma.organizationInvitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' },
            });
            throw ApiError.conflict('You are already a member of this organization');
        }
        // Accept invitation in transaction
        const [member] = await prisma.$transaction([
            prisma.organizationMember.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId,
                    role: invitation.role,
                },
                include: {
                    organization: true,
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            }),
            prisma.organizationInvitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { currentOrganizationId: invitation.organizationId },
            }),
        ]);
        return member;
    }
    async rejectInvitation(token, userId) {
        const invitation = await this.getInvitationByToken(token);
        // Check if user email matches invitation
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (user?.email !== invitation.email) {
            throw ApiError.forbidden('Invitation was sent to a different email');
        }
        await prisma.organizationInvitation.update({
            where: { id: invitation.id },
            data: { status: 'REJECTED' },
        });
    }
    // Dashboard stats
    async getDashboardStats(orgId, userId) {
        await this.findById(orgId, userId);
        const [projectCount, memberCount, taskStats, recentActivity, recentProjects,] = await Promise.all([
            prisma.project.count({ where: { organizationId: orgId } }),
            prisma.organizationMember.count({ where: { organizationId: orgId } }),
            prisma.task.groupBy({
                by: ['status'],
                where: { project: { organizationId: orgId } },
                _count: { id: true },
            }),
            prisma.activity.findMany({
                where: { task: { project: { organizationId: orgId } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                    task: {
                        select: { id: true, title: true, taskNumber: true, project: { select: { key: true } } },
                    },
                },
            }),
            prisma.project.findMany({
                where: { organizationId: orgId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: {
                    _count: { select: { tasks: true, members: true } },
                },
            }),
        ]);
        const tasksByStatus = taskStats.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
        }, {});
        const totalTasks = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);
        const completedTasks = tasksByStatus['DONE'] || 0;
        return {
            projectCount,
            memberCount,
            totalTasks,
            completedTasks,
            tasksByStatus,
            recentActivity,
            recentProjects,
        };
    }
    // Get projects for organization
    async getProjects(orgId, userId, page = 1, limit = 10) {
        await this.findById(orgId, userId);
        const skip = (page - 1) * limit;
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where: { organizationId: orgId },
                include: {
                    owner: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                    _count: {
                        select: { tasks: true, members: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.project.count({
                where: { organizationId: orgId },
            }),
        ]);
        return { projects, total };
    }
    // Check if user needs to create an organization
    async userNeedsOrganization(userId) {
        const membershipCount = await prisma.organizationMember.count({
            where: { userId },
        });
        return membershipCount === 0;
    }
    // Switch user's current organization
    async switchOrganization(userId, orgId) {
        // Verify membership
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId,
                },
            },
            include: {
                organization: true,
            },
        });
        if (!membership) {
            throw ApiError.forbidden('Not a member of this organization');
        }
        await prisma.user.update({
            where: { id: userId },
            data: { currentOrganizationId: orgId },
        });
        return membership.organization;
    }
}
export const organizationService = new OrganizationService();
//# sourceMappingURL=organization.service.js.map