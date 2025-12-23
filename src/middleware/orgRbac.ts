import type { Response, NextFunction } from 'express';
import { OrganizationRole } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../types/index.js';

// Organization role hierarchy - higher index = more permissions
const ORG_ROLE_HIERARCHY: OrganizationRole[] = [
  OrganizationRole.GUEST,
  OrganizationRole.MEMBER,
  OrganizationRole.MANAGER,
  OrganizationRole.ADMIN,
  OrganizationRole.OWNER,
];

const getOrgRoleLevel = (role: OrganizationRole): number => {
  return ORG_ROLE_HIERARCHY.indexOf(role);
};

// Extended request type with organization info
export interface OrgAuthRequest extends AuthRequest {
  organization?: {
    id: string;
    role: OrganizationRole;
  };
}

// Middleware to load organization context from params
export const loadOrgContext = async (
  req: OrgAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const orgId = req.params.orgId;
    if (!orgId) {
      next();
      return;
    }

    // Check organization membership
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: req.user.id,
        },
      },
      select: { role: true, organizationId: true },
    });

    if (member) {
      req.organization = {
        id: member.organizationId,
        role: member.role,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has any of the allowed organization roles
export const requireOrgRole = (...allowedRoles: OrganizationRole[]) => {
  return async (
    req: OrgAuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const orgId = req.params.orgId || req.body.organizationId;
      if (!orgId) {
        throw ApiError.badRequest('Organization ID is required');
      }

      // Check organization membership
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: req.user.id,
          },
        },
        select: { role: true },
      });

      if (!member) {
        throw ApiError.forbidden('Not a member of this organization');
      }

      if (!allowedRoles.includes(member.role)) {
        throw ApiError.forbidden('Insufficient organization permissions');
      }

      // Attach org context to request
      req.organization = {
        id: orgId,
        role: member.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has minimum organization role level
export const requireMinOrgRole = (minRole: OrganizationRole) => {
  return async (
    req: OrgAuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const orgId = req.params.orgId || req.body.organizationId;
      if (!orgId) {
        throw ApiError.badRequest('Organization ID is required');
      }

      // Check organization membership
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: req.user.id,
          },
        },
        select: { role: true },
      });

      if (!member) {
        throw ApiError.forbidden('Not a member of this organization');
      }

      const userLevel = getOrgRoleLevel(member.role);
      const requiredLevel = getOrgRoleLevel(minRole);

      if (userLevel < requiredLevel) {
        throw ApiError.forbidden('Insufficient organization permissions');
      }

      // Attach org context to request
      req.organization = {
        id: orgId,
        role: member.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has any access to organization (any role)
export const requireOrgAccess = async (
  req: OrgAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const orgId = req.params.orgId || req.body.organizationId;
    if (!orgId) {
      throw ApiError.badRequest('Organization ID is required');
    }

    // Check organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, isActive: true },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    if (!organization.isActive) {
      throw ApiError.forbidden('Organization is inactive');
    }

    // Check organization membership
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: req.user.id,
        },
      },
      select: { role: true },
    });

    if (!member) {
      throw ApiError.forbidden('Not a member of this organization');
    }

    // Attach org context to request
    req.organization = {
      id: orgId,
      role: member.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is organization owner
export const requireOrgOwner = async (
  req: OrgAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const orgId = req.params.orgId || req.body.organizationId;
    if (!orgId) {
      throw ApiError.badRequest('Organization ID is required');
    }

    // Check organization membership with owner role
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: req.user.id,
        },
      },
      select: { role: true },
    });

    if (!member || member.role !== 'OWNER') {
      throw ApiError.forbidden('Only organization owner can perform this action');
    }

    // Attach org context to request
    req.organization = {
      id: orgId,
      role: member.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Helper to check role level (for use in services)
export const hasMinOrgRoleLevel = (
  userRole: OrganizationRole,
  minRole: OrganizationRole
): boolean => {
  return getOrgRoleLevel(userRole) >= getOrgRoleLevel(minRole);
};
