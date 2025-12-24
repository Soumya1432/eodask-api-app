import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
export class AuthService {
    async register(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw ApiError.conflict('Email already registered');
        }
        // If invitation token provided, validate it
        let invitation = null;
        if (data.invitationToken) {
            invitation = await prisma.organizationInvitation.findUnique({
                where: { token: data.invitationToken },
                include: {
                    organization: {
                        select: { id: true, name: true, slug: true },
                    },
                },
            });
            if (!invitation) {
                throw ApiError.badRequest('Invalid invitation token');
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
            // Verify email matches invitation
            if (invitation.email !== data.email) {
                throw ApiError.badRequest(`This invitation was sent to ${invitation.email}. Please register with that email.`);
            }
        }
        // Handle name or firstName/lastName
        let firstName = data.firstName || '';
        let lastName = data.lastName || '';
        if (data.name && !data.firstName) {
            const nameParts = data.name.trim().split(/\s+/);
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }
        const hashedPassword = await bcrypt.hash(data.password, 12);
        // Create user and handle invitation in transaction if needed
        if (invitation) {
            // Create user with invitation - automatically add to organization
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    currentOrganizationId: invitation.organizationId,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true,
                    currentOrganizationId: true,
                },
            });
            // Add user to organization and accept invitation
            await prisma.$transaction([
                prisma.organizationMember.create({
                    data: {
                        organizationId: invitation.organizationId,
                        userId: user.id,
                        role: invitation.role,
                    },
                }),
                prisma.organizationInvitation.update({
                    where: { id: invitation.id },
                    data: { status: 'ACCEPTED' },
                }),
            ]);
            const tokens = await this.generateTokens(user.id, user.email);
            return {
                user,
                ...tokens,
                organization: invitation.organization,
                invitationAccepted: true,
            };
        }
        // Normal registration without invitation
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName,
                lastName,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
            },
        });
        const tokens = await this.generateTokens(user.id, user.email);
        return { user, ...tokens };
    }
    async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw ApiError.unauthorized('Invalid credentials');
        }
        if (!user.isActive) {
            throw ApiError.forbidden('Account is deactivated');
        }
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw ApiError.unauthorized('Invalid credentials');
        }
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email);
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, ...tokens };
    }
    async refreshToken(refreshToken) {
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken) {
            throw ApiError.unauthorized('Invalid refresh token');
        }
        if (storedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw ApiError.unauthorized('Refresh token expired');
        }
        // Delete old refresh token
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });
        const tokens = await this.generateTokens(storedToken.user.id, storedToken.user.email);
        return tokens;
    }
    async logout(refreshToken) {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async logoutAll(userId) {
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async generateTokens(userId, email, role) {
        const payload = { userId, email, role };
        const accessToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
        const refreshToken = uuidv4();
        const refreshExpiresIn = this.parseExpiry(config.jwt.refreshExpiresIn);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt: new Date(Date.now() + refreshExpiresIn),
            },
        });
        return { accessToken, refreshToken };
    }
    parseExpiry(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000; // Default 7 days
        const value = parseInt(match[1] ?? '7', 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value * 1000;
            case 'm':
                return value * 60 * 1000;
            case 'h':
                return value * 60 * 60 * 1000;
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            default:
                return 7 * 24 * 60 * 60 * 1000;
        }
    }
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        return user;
    }
    async updateProfile(userId, data) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw ApiError.badRequest('Current password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        // Invalidate all refresh tokens
        await this.logoutAll(userId);
    }
}
export const authService = new AuthService();
//# sourceMappingURL=auth.service.js.map