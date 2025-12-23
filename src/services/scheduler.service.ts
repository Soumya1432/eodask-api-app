import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { emailService } from './email.service.js';
import { getSocketEmitter } from '../socket/index.js';

class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  init(): void {
    console.log('Initializing scheduler service...');

    // Check for overdue tasks every hour
    this.scheduleJob('overdue-tasks', '0 * * * *', this.checkOverdueTasks.bind(this));

    // Send daily digest at 9 AM
    this.scheduleJob('daily-digest', '0 9 * * *', this.sendDailyDigest.bind(this));

    // Clean up expired refresh tokens daily at midnight
    this.scheduleJob('cleanup-tokens', '0 0 * * *', this.cleanupExpiredTokens.bind(this));

    // Clean up expired invitations daily
    this.scheduleJob('cleanup-invitations', '0 1 * * *', this.cleanupExpiredInvitations.bind(this));

    // Send reminder for tasks due tomorrow at 5 PM
    this.scheduleJob('task-reminders', '0 17 * * *', this.sendTaskReminders.bind(this));

    console.log('Scheduler service initialized with', this.jobs.size, 'jobs');
  }

  private scheduleJob(name: string, cronExpression: string, handler: () => Promise<void>): void {
    const job = cron.schedule(cronExpression, async () => {
      console.log(`Running scheduled job: ${name}`);
      try {
        await handler();
        console.log(`Completed scheduled job: ${name}`);
      } catch (error) {
        console.error(`Error in scheduled job ${name}:`, error);
      }
    });

    this.jobs.set(name, job);
  }

  private async checkOverdueTasks(): Promise<void> {
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    const socketEmitter = getSocketEmitter();

    for (const task of overdueTasks) {
      // Notify assignees
      for (const assignee of task.assignees) {
        // Create notification
        await prisma.notification.create({
          data: {
            userId: assignee.user.id,
            type: 'TASK_OVERDUE',
            title: 'Task Overdue',
            message: `Task "${task.title}" in project "${task.project.name}" is overdue.`,
            data: JSON.stringify({
              taskId: task.id,
              projectId: task.projectId,
            }),
          },
        });

        // Send real-time notification
        if (socketEmitter) {
          socketEmitter.sendNotification(assignee.user.id, {
            type: 'TASK_OVERDUE',
            title: 'Task Overdue',
            message: `Task "${task.title}" is overdue`,
            taskId: task.id,
            projectId: task.projectId,
          });
        }
      }
    }
  }

  private async sendDailyDigest(): Promise<void> {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, name: true },
    });

    for (const user of users) {
      // Get user's tasks due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasksDueToday = await prisma.task.findMany({
        where: {
          assignees: { some: { userId: user.id } },
          dueDate: { gte: today, lt: tomorrow },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        include: {
          project: { select: { name: true } },
        },
      });

      // Get overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          assignees: { some: { userId: user.id } },
          dueDate: { lt: today },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        include: {
          project: { select: { name: true } },
        },
      });

      if (tasksDueToday.length > 0 || overdueTasks.length > 0) {
        // In production, you would send an actual email
        console.log(`Sending daily digest to ${user.email}:`, {
          tasksDueToday: tasksDueToday.length,
          overdueTasks: overdueTasks.length,
        });
      }
    }
  }

  private async cleanupExpiredTokens(): Promise<void> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    console.log(`Cleaned up ${result.count} expired refresh tokens`);
  }

  private async cleanupExpiredInvitations(): Promise<void> {
    const result = await prisma.invitation.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'PENDING',
      },
    });

    console.log(`Cleaned up ${result.count} expired invitations`);
  }

  private async sendTaskReminders(): Promise<void> {
    // Get tasks due tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const tasksDueTomorrow = await prisma.task.findMany({
      where: {
        dueDate: { gte: tomorrow, lt: dayAfterTomorrow },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    const socketEmitter = getSocketEmitter();

    for (const task of tasksDueTomorrow) {
      for (const assignee of task.assignees) {
        // Create notification
        await prisma.notification.create({
          data: {
            userId: assignee.user.id,
            type: 'TASK_DUE_SOON',
            title: 'Task Due Tomorrow',
            message: `Task "${task.title}" in project "${task.project.name}" is due tomorrow.`,
            data: JSON.stringify({
              taskId: task.id,
              projectId: task.projectId,
            }),
          },
        });

        // Send real-time notification
        if (socketEmitter) {
          socketEmitter.sendNotification(assignee.user.id, {
            type: 'TASK_DUE_SOON',
            title: 'Task Due Tomorrow',
            message: `Task "${task.title}" is due tomorrow`,
            taskId: task.id,
            projectId: task.projectId,
          });
        }

        // Send email reminder
        try {
          await emailService.sendTaskReminder(
            assignee.user.email,
            assignee.user.name,
            task.title,
            task.project.name,
            task.dueDate!
          );
        } catch (error) {
          console.error('Error sending task reminder email:', error);
        }
      }
    }
  }

  stopAll(): void {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped scheduled job: ${name}`);
    }
    this.jobs.clear();
  }
}

export const schedulerService = new SchedulerService();
