import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export interface OrganizationAnalytics {
  overview: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    totalMembers: number;
    tasksThisWeek: number;
    tasksLastWeek: number;
    weeklyChange: number;
  };
  tasksByStatus: Array<{ status: string; count: number; color: string }>;
  tasksByPriority: Array<{ priority: string; count: number; color: string }>;
  recentActivity: Array<{
    id: string;
    type: string;
    user: { id: string; name: string; avatar: string | null };
    description: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }>;
  performance: {
    completionRate: number;
    onTimeDeliveryRate: number;
    avgCompletionTime: number; // in days
    overdueTasksCount: number;
  };
  projectStats: Array<{
    id: string;
    name: string;
    color: string;
    taskCount: number;
    completedCount: number;
    memberCount: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    created: number;
    completed: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#6b7280',
  TODO: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW: '#8b5cf6',
  DONE: '#10b981',
  CANCELLED: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

class AnalyticsService {
  async getOrganizationAnalytics(organizationId: string, userId: string): Promise<OrganizationAnalytics> {
    // Verify user has access to this organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!membership) {
      throw ApiError.forbidden('Not a member of this organization');
    }

    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Get all projects for this organization (use status instead of isArchived)
    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        status: { not: 'ARCHIVED' }
      },
      include: {
        members: true,
        tasks: true,
      },
    });

    const projectIds = projects.map(p => p.id);

    // Get all tasks for organization projects
    const allTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
    });

    // Get tasks created this week
    const tasksThisWeek = allTasks.filter(t => t.createdAt >= startOfThisWeek).length;
    const tasksLastWeek = allTasks.filter(
      t => t.createdAt >= startOfLastWeek && t.createdAt < startOfThisWeek
    ).length;

    // Get unique members across all projects
    const memberIds = new Set<string>();
    projects.forEach(p => p.members.forEach(m => memberIds.add(m.userId)));

    // Tasks by status
    const statusCounts: Record<string, number> = {};
    allTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    const tasksByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: STATUS_COLORS[status] || '#6b7280',
    }));

    // Tasks by priority
    const priorityCounts: Record<string, number> = {};
    allTasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });

    const tasksByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      color: PRIORITY_COLORS[priority] || '#6b7280',
    }));

    // Recent activity (last 10 notifications/activities)
    const recentNotifications = await prisma.notification.findMany({
      where: {
        user: {
          organizationMembers: {
            some: { organizationId },
          },
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentActivity = recentNotifications.map(n => ({
      id: n.id,
      type: n.type,
      user: {
        id: n.user.id,
        name: [n.user.firstName, n.user.lastName].filter(Boolean).join(' ') || 'Unknown User',
        avatar: n.user.avatar,
      },
      description: n.message,
      metadata: (n.metadata as Record<string, unknown>) || {},
      createdAt: n.createdAt,
    }));

    // Performance metrics
    const completedTasks = allTasks.filter(t => t.status === 'DONE');
    const completionRate = allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    // On-time delivery (tasks completed before or on due date)
    // Since Task doesn't have completedAt field, use updatedAt for DONE tasks as proxy
    const tasksWithDueDate = completedTasks.filter(t => t.dueDate);
    const onTimeTasks = tasksWithDueDate.filter(t => {
      if (!t.dueDate) return false;
      // Use updatedAt as approximate completion date
      return t.updatedAt <= t.dueDate;
    });
    const onTimeDeliveryRate = tasksWithDueDate.length > 0
      ? Math.round((onTimeTasks.length / tasksWithDueDate.length) * 100)
      : 100;

    // Average completion time (using updatedAt as completion time for DONE tasks)
    const completionTimes = completedTasks.map(t => {
      const created = t.createdAt.getTime();
      const completed = t.updatedAt.getTime();
      return (completed - created) / (1000 * 60 * 60 * 24); // days
    });
    const avgCompletionTime = completionTimes.length > 0
      ? Math.round((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) * 10) / 10
      : 0;

    // Overdue tasks
    const overdueTasksCount = allTasks.filter(t => {
      if (t.status === 'DONE' || t.status === 'CANCELLED' || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Project stats
    const projectStats = projects.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color || '#6366f1',
      taskCount: p.tasks.length,
      completedCount: p.tasks.filter(t => t.status === 'DONE').length,
      memberCount: p.members.length,
    }));

    // Weekly trend (last 8 weeks)
    const weeklyTrend: Array<{ week: string; created: number; completed: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const created = allTasks.filter(
        t => t.createdAt >= weekStart && t.createdAt < weekEnd
      ).length;

      // Use updatedAt for DONE tasks as completion date
      const completed = allTasks.filter(
        t => t.status === 'DONE' && t.updatedAt >= weekStart && t.updatedAt < weekEnd
      ).length;

      weeklyTrend.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        completed,
      });
    }

    return {
      overview: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        totalMembers: memberIds.size,
        tasksThisWeek,
        tasksLastWeek,
        weeklyChange: tasksLastWeek > 0
          ? Math.round(((tasksThisWeek - tasksLastWeek) / tasksLastWeek) * 100)
          : 0,
      },
      tasksByStatus,
      tasksByPriority,
      recentActivity,
      performance: {
        completionRate,
        onTimeDeliveryRate,
        avgCompletionTime,
        overdueTasksCount,
      },
      projectStats,
      weeklyTrend,
    };
  }

  async getProjectAnalytics(projectId: string, userId: string) {
    // Verify user has access to this project
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { userId, projectId } },
    });

    if (!membership) {
      throw ApiError.forbidden('Not a member of this project');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatar: true },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const now = new Date();
    const tasks = project.tasks;

    // Tasks by status
    const statusCounts: Record<string, number> = {};
    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    // Tasks by priority
    const priorityCounts: Record<string, number> = {};
    tasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });

    // Tasks by assignee
    const assigneeCounts: Record<string, { name: string; avatar: string | null; count: number }> = {};
    tasks.forEach(task => {
      task.assignees.forEach(a => {
        const name = [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || 'Unknown';
        if (!assigneeCounts[a.userId]) {
          assigneeCounts[a.userId] = { name, avatar: a.user.avatar, count: 0 };
        }
        assigneeCounts[a.userId].count++;
      });
    });

    // Overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'DONE' || t.status === 'CANCELLED' || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        color: project.color,
      },
      overview: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        overdueTasks: overdueTasks.length,
        memberCount: project.members.length,
      },
      tasksByStatus: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: STATUS_COLORS[status] || '#6b7280',
      })),
      tasksByPriority: Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
        color: PRIORITY_COLORS[priority] || '#6b7280',
      })),
      tasksByAssignee: Object.entries(assigneeCounts).map(([userId, data]) => ({
        userId,
        ...data,
      })),
      overdueTasks: overdueTasks.map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
