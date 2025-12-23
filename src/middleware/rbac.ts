import type { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../types/index.js';

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: Role[] = [
  Role.GUEST,
  Role.MEMBER,
  Role.MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

const getRoleLevel = (role: Role): number => {
  return ROLE_HIERARCHY.indexOf(role);
};

// Check if user has minimum role level
export const requireRole = (...allowedRoles: Role[]) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const userRole = req.user.role;
      if (!userRole) {
        throw ApiError.forbidden('No role assigned');
      }

      if (!allowedRoles.includes(userRole)) {
        throw ApiError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has minimum role in hierarchy
export const requireMinRole = (minRole: Role) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const userRole = req.user.role;
      if (!userRole) {
        throw ApiError.forbidden('No role assigned');
      }

      const userLevel = getRoleLevel(userRole);
      const requiredLevel = getRoleLevel(minRole);

      if (userLevel < requiredLevel) {
        throw ApiError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check project-specific role
export const requireProjectRole = (...allowedRoles: Role[]) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const projectId = req.params.projectId || req.body.projectId;
      if (!projectId) {
        throw ApiError.badRequest('Project ID is required');
      }

      // Check if user is project owner
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });

      if (project?.ownerId === req.user.id) {
        next();
        return;
      }

      // Check project membership role
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
        select: { role: true },
      });

      if (!member) {
        throw ApiError.forbidden('Not a member of this project');
      }

      if (!allowedRoles.includes(member.role)) {
        throw ApiError.forbidden('Insufficient project permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can access project (any role)
export const requireProjectAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      throw ApiError.badRequest('Project ID is required');
    }

    // Check if user is project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.ownerId === req.user.id) {
      next();
      return;
    }

    // Check project membership
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member) {
      throw ApiError.forbidden('Not a member of this project');
    }

    next();
  } catch (error) {
    next(error);
  }
};
