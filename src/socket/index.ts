import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import type { JwtPayload } from '../types/index.js';

interface AuthenticatedSocket {
  userId: string;
  email: string;
  role: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: AuthenticatedSocket;
  }
}

declare module 'socket.io'{
  interface SocketFile {
    user?:AuthenticatedSocket;
    file?:File
  }
}



export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST','PATCH'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });



  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = {
        userId: user.id,
        email: user.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user!.userId;
    console.log(`User connected: ${userId}`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Broadcast online status (user online tracking done via socket connection state)
    io.emit('user:online', { userId });

    // Join project rooms
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    projectMembers.forEach((member) => {
      socket.join(`project:${member.projectId}`);
    });

    // Join chat rooms
    const chatParticipants = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatRoomId: true },
    });

    chatParticipants.forEach((participant) => {
      socket.join(`chat:${participant.chatRoomId}`);
    });

    // Join organization rooms for analytics updates
    const orgMemberships = await prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    orgMemberships.forEach((membership) => {
      socket.join(`organization:${membership.organizationId}`);
    });

    // Handle joining organization room
    socket.on('organization:join', async (organizationId: string) => {
      const isMember = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
      });

      if (isMember) {
        socket.join(`organization:${organizationId}`);
        socket.emit('organization:joined', { organizationId });
      }
    });

    // Handle leaving organization room
    socket.on('organization:leave', (organizationId: string) => {
      socket.leave(`organization:${organizationId}`);
      socket.emit('organization:left', { organizationId });
    });

    // Handle joining a project room
    socket.on('project:join', async (projectId: string) => {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });

      if (isMember) {
        socket.join(`project:${projectId}`);
        socket.emit('project:joined', { projectId });
      }
    });

    // Handle leaving a project room
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.emit('project:left', { projectId });
    });

    // Handle joining a chat room
    socket.on('chat:join', async (roomId: string) => {
      const isParticipant = await prisma.chatParticipant.findUnique({
        where: { chatRoomId_userId: { chatRoomId: roomId, userId } },
      });

      if (isParticipant) {
        socket.join(`chat:${roomId}`);
        socket.emit('chat:joined', { roomId });
      }
    });

    // Handle leaving a chat room
    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
      socket.emit('chat:left', { roomId });
    });

    // Handle typing indicator
    socket.on('chat:typing', (roomId: string) => {
      socket.to(`chat:${roomId}`).emit('chat:user_typing', {
        roomId,
        userId,
        email: socket.user!.email,
      });
    });

    // Handle stop typing
    socket.on('chat:stop_typing', (roomId: string) => {
      socket.to(`chat:${roomId}`).emit('chat:user_stop_typing', {
        roomId,
        userId,
      });
    });

    // Handle mark messages as read
    socket.on('chat:mark_read', async (roomId: string) => {
      // Update the participant's lastReadAt timestamp
      await prisma.chatParticipant.update({
        where: { chatRoomId_userId: { chatRoomId: roomId, userId } },
        data: { lastReadAt: new Date() },
      });

      socket.to(`chat:${roomId}`).emit('chat:messages_read', {
        roomId,
        userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);

      // Broadcast offline status
      io.emit('user:offline', { userId, lastSeen: new Date() });
    });
  });

  return io;
};

// Socket event emitters for use in services
export class SocketEmitter {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
  }

  // Task events
  taskCreated(projectId: string, task: unknown): void {
    this.io.to(`project:${projectId}`).emit('task:created', task);
  }

  taskUpdated(projectId: string, task: unknown): void {
    this.io.to(`project:${projectId}`).emit('task:updated', task);
  }

  taskDeleted(projectId: string, taskId: string): void {
    this.io.to(`project:${projectId}`).emit('task:deleted', { taskId });
  }

  taskMoved(projectId: string, task: unknown): void {
    this.io.to(`project:${projectId}`).emit('task:moved', task);
  }

  taskAssigned(projectId: string, taskId: string, assignee: unknown): void {
    this.io.to(`project:${projectId}`).emit('task:assigned', { taskId, assignee });
  }

  // Project events
  projectUpdated(projectId: string, project: unknown): void {
    this.io.to(`project:${projectId}`).emit('project:updated', project);
  }

  memberAdded(projectId: string, member: unknown): void {
    this.io.to(`project:${projectId}`).emit('project:member_added', member);
  }

  memberRemoved(projectId: string, userId: string): void {
    this.io.to(`project:${projectId}`).emit('project:member_removed', { userId });
  }

  // Chat events
  messageSent(roomId: string, message: unknown): void {
    this.io.to(`chat:${roomId}`).emit('chat:message', message);
  }

  messageDeleted(roomId: string, messageId: string): void {
    this.io.to(`chat:${roomId}`).emit('chat:message_deleted', { messageId });
  }

  // Notification events
  sendNotification(userId: string, notification: unknown): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Comment events
  commentAdded(projectId: string, taskId: string, comment: unknown): void {
    this.io.to(`project:${projectId}`).emit('task:comment_added', { taskId, comment });
  }

  commentDeleted(projectId: string, taskId: string, commentId: string): void {
    this.io.to(`project:${projectId}`).emit('task:comment_deleted', { taskId, commentId });
  }

  // Analytics events
  analyticsUpdated(organizationId: string, analytics: unknown): void {
    this.io.to(`organization:${organizationId}`).emit('analytics:updated', analytics);
  }

  statsUpdated(organizationId: string, metric: string, value: unknown): void {
    this.io.to(`organization:${organizationId}`).emit('analytics:stat_updated', { metric, value });
  }

  // Trigger analytics refresh for all clients in organization
  triggerAnalyticsRefresh(organizationId: string): void {
    this.io.to(`organization:${organizationId}`).emit('analytics:refresh');
  }
}

let socketEmitter: SocketEmitter | null = null;

export const setSocketEmitter = (io: SocketServer): void => {
  socketEmitter = new SocketEmitter(io);
};

export const getSocketEmitter = (): SocketEmitter | null => {
  return socketEmitter;
};
