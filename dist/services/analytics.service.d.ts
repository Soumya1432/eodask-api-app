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
    tasksByStatus: Array<{
        status: string;
        count: number;
        color: string;
    }>;
    tasksByPriority: Array<{
        priority: string;
        count: number;
        color: string;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        user: {
            id: string;
            name: string;
            avatar: string | null;
        };
        description: string;
        metadata: Record<string, unknown>;
        createdAt: Date;
    }>;
    performance: {
        completionRate: number;
        onTimeDeliveryRate: number;
        avgCompletionTime: number;
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
declare class AnalyticsService {
    getOrganizationAnalytics(organizationId: string, userId: string): Promise<OrganizationAnalytics>;
    getProjectAnalytics(projectId: string, userId: string): Promise<{
        project: {
            id: string;
            name: string;
            color: string;
        };
        overview: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            overdueTasks: number;
            memberCount: number;
        };
        tasksByStatus: {
            status: string;
            count: number;
            color: string;
        }[];
        tasksByPriority: {
            priority: string;
            count: number;
            color: string;
        }[];
        tasksByAssignee: {
            name: string;
            avatar: string | null;
            count: number;
            userId: string;
        }[];
        overdueTasks: {
            id: string;
            title: string;
            dueDate: Date | null;
            priority: import("@prisma/client").$Enums.TaskPriority;
        }[];
    }>;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=analytics.service.d.ts.map