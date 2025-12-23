import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import type { ProjectStatus, Role, TaskStatus } from '@prisma/client';
import { emailService } from './email.service.js';
import { config } from '../config/index.js';

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

export class ProjectService {
  async create(userId: string, data: CreateProjectData) {
    // Verify user is member of organization with permission to create projects
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
          userId,
        },
      },
    });

    if (!orgMember) {
      throw ApiError.forbidden('Not a member of this organization');
    }

    // Only MEMBER and above can create projects
    const allowedRoles = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];
    if (!allowedRoles.includes(orgMember.role)) {
      throw ApiError.forbidden('Insufficient permissions to create projects');
    }

    // Check if key is unique
    const existingProject = await prisma.project.findUnique({
      where: { key: data.key.toUpperCase() },
    });

    if (existingProject) {
      throw ApiError.conflict('Project key already exists');
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        key: data.key.toUpperCase(),
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
        organizationId: data.organizationId,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
        // Create default board with columns
        boards: {
          create: {
            name: 'Main Board',
            columns: {
              create: [
                { name: 'Backlog', status: 'BACKLOG', order: 0, color: '#6b7280' },
                { name: 'To Do', status: 'TODO', order: 1, color: '#3b82f6' },
                { name: 'In Progress', status: 'IN_PROGRESS', order: 2, color: '#f59e0b' },
                { name: 'In Review', status: 'IN_REVIEW', order: 3, color: '#8b5cf6' },
                { name: 'Done', status: 'DONE', order: 4, color: '#10b981' },
              ],
            },
          },
        },
        // Create default labels
        labels: {
          create: [
            { name: 'Bug', color: '#ef4444' },
            { name: 'Feature', color: '#3b82f6' },
            { name: 'Enhancement', color: '#10b981' },
            { name: 'Documentation', color: '#6b7280' },
          ],
        },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        boards: {
          include: { columns: true },
        },
        labels: true,
      },
    });

    return project;
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
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
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      }),
    ]);

    return { projects, total };
  }

  async findById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        boards: {
          include: {
            columns: {
              orderBy: { order: 'asc' },
            },
          },
        },
        labels: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check access
    const hasAccess =
      project.ownerId === userId ||
      project.members.some((m) => m.userId === userId);

    if (!hasAccess) {
      throw ApiError.forbidden('Not a member of this project');
    }

    return project;
  }

  async update(projectId: string, userId: string, data: UpdateProjectData) {
    const project = await this.findById(projectId, userId);

    // Check if user is owner or admin
    const member = project.members.find((m) => m.userId === userId);
    if (project.ownerId !== userId && member?.role !== 'ADMIN') {
      throw ApiError.forbidden('Only project owner or admin can update project');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    return updated;
  }

  async delete(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.ownerId !== userId) {
      throw ApiError.forbidden('Only project owner can delete project');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });
  }

  async addMember(projectId: string, userId: string, memberEmail: string, role: Role) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check if requester is owner or admin
    const requester = project.members.find((m) => m.userId === userId);
    if (project.ownerId !== userId && requester?.role !== 'ADMIN') {
      throw ApiError.forbidden('Only project owner or admin can add members');
    }

    // Get the sender info
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const user = await prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!user) {
      // User doesn't exist - create an invitation instead
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: memberEmail,
          projectId,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        throw ApiError.conflict('Invitation already sent to this email');
      }

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          email: memberEmail,
          projectId,
          role,
          inviterId: userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });

      // Send invitation email
      const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'A team member';
      try {
        await emailService.sendInvitation(
          memberEmail,
          project.name,
          senderName,
          role,
          invitation.token
        );
      } catch (error) {
        console.error('Failed to send invitation email:', error);
        // Don't throw - invitation was created successfully
      }

      return {
        type: 'invitation',
        invitation,
        message: `Invitation sent to ${memberEmail}`,
      };
    }

    // Check if already a member
    const existingMember = project.members.find((m) => m.userId === user.id);
    if (existingMember) {
      throw ApiError.conflict('User is already a member');
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    // Send notification email to the added member
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'A team member';
    try {
      await emailService.sendTaskAssignmentNotification(
        user.email,
        `${user.firstName} ${user.lastName}`,
        `Added to project: ${project.name}`,
        project.name,
        `${config.clientUrl}/projects/${projectId}`
      );
    } catch (error) {
      console.error('Failed to send member notification email:', error);
      // Don't throw - member was added successfully
    }

    return {
      type: 'member',
      member,
      message: `${user.firstName} ${user.lastName} added to project`,
    };
  }

  async removeMember(projectId: string, userId: string, memberId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Can't remove owner
    if (project.ownerId === memberId) {
      throw ApiError.badRequest('Cannot remove project owner');
    }

    // Check if requester is owner or admin
    const requester = project.members.find((m) => m.userId === userId);
    if (project.ownerId !== userId && requester?.role !== 'ADMIN') {
      throw ApiError.forbidden('Only project owner or admin can remove members');
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: memberId,
        },
      },
    });
  }

  async updateMemberRole(projectId: string, userId: string, memberId: string, role: Role) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Can't change owner's role
    if (project.ownerId === memberId) {
      throw ApiError.badRequest('Cannot change project owner role');
    }

    // Only owner can update roles
    if (project.ownerId !== userId) {
      throw ApiError.forbidden('Only project owner can update member roles');
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
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

  async getMembers(projectId: string, userId: string) {
    // Check if user has access to project
    await this.findById(projectId, userId);

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members;
  }

  async getColumns(projectId: string, userId: string) {
    // Check if user has access to project
    await this.findById(projectId, userId);

    const board = await prisma.board.findFirst({
      where: { projectId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Add projectId to each column for frontend compatibility
    return (board?.columns || []).map(column => ({
      ...column,
      projectId,
    }));
  }

  async createColumn(projectId: string, userId: string, data: { name: string; order?: number }) {
    // Check if user has access to project
    await this.findById(projectId, userId);

    const board = await prisma.board.findFirst({
      where: { projectId },
    });

    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    // Get the max order if not provided
    let order = data.order;
    if (order === undefined) {
      const maxColumn = await prisma.boardColumn.findFirst({
        where: { boardId: board.id },
        orderBy: { order: 'desc' },
      });
      order = (maxColumn?.order ?? -1) + 1;
    }

    const column = await prisma.boardColumn.create({
      data: {
        name: data.name,
        order,
        boardId: board.id,
        status: 'TODO', // Default status
        color: '#3b82f6', // Default color
      },
    });

    // Add projectId for frontend compatibility
    return { ...column, projectId };
  }

  async updateColumn(
    projectId: string,
    userId: string,
    columnId: string,
    data: { name?: string; order?: number }
  ) {
    // Check if user has access to project
    await this.findById(projectId, userId);

    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (!column || column.board.projectId !== projectId) {
      throw ApiError.notFound('Column not found');
    }

    const updated = await prisma.boardColumn.update({
      where: { id: columnId },
      data,
    });

    // Add projectId for frontend compatibility
    return { ...updated, projectId };
  }

  async deleteColumn(projectId: string, userId: string, columnId: string) {
    // Check if user has access to project
    await this.findById(projectId, userId);

    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { board: true, tasks: true },
    });

    if (!column || column.board.projectId !== projectId) {
      throw ApiError.notFound('Column not found');
    }

    if (column.tasks.length > 0) {
      throw ApiError.badRequest('Cannot delete column with tasks. Move or delete tasks first.');
    }

    await prisma.boardColumn.delete({
      where: { id: columnId },
    });
  }

  async reorderColumns(projectId: string, userId: string, columnOrders: { id: string; order: number }[]) {
    // Check if user has access to project
    await this.findById(projectId, userId);

    const updates = columnOrders.map((col) =>
      prisma.boardColumn.update({
        where: { id: col.id },
        data: { order: col.order },
      })
    );

    await prisma.$transaction(updates);

    // Return updated columns
    return this.getColumns(projectId, userId);
  }

  async getStats(projectId: string) {
    const [tasksByStatus, tasksByPriority, recentActivity] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true },
      }),
      prisma.activity.findMany({
        where: { task: { projectId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          task: {
            select: { id: true, title: true, taskNumber: true },
          },
        },
      }),
    ]);

    return {
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<TaskStatus, number>),
      tasksByPriority: tasksByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentActivity,
    };
  }
}

export const projectService = new ProjectService();
