import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
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
declare module 'socket.io' {
    interface SocketFile {
        user?: AuthenticatedSocket;
        file?: File;
    }
}
export declare const initializeSocket: (httpServer: HttpServer) => SocketServer;
export declare class SocketEmitter {
    private io;
    constructor(io: SocketServer);
    taskCreated(projectId: string, task: unknown): void;
    taskUpdated(projectId: string, task: unknown): void;
    taskDeleted(projectId: string, taskId: string): void;
    taskMoved(projectId: string, task: unknown): void;
    taskAssigned(projectId: string, taskId: string, assignee: unknown): void;
    projectUpdated(projectId: string, project: unknown): void;
    memberAdded(projectId: string, member: unknown): void;
    memberRemoved(projectId: string, userId: string): void;
    messageSent(roomId: string, message: unknown): void;
    messageDeleted(roomId: string, messageId: string): void;
    sendNotification(userId: string, notification: unknown): void;
    commentAdded(projectId: string, taskId: string, comment: unknown): void;
    commentDeleted(projectId: string, taskId: string, commentId: string): void;
    analyticsUpdated(organizationId: string, analytics: unknown): void;
    statsUpdated(organizationId: string, metric: string, value: unknown): void;
    triggerAnalyticsRefresh(organizationId: string): void;
}
export declare const setSocketEmitter: (io: SocketServer) => void;
export declare const getSocketEmitter: () => SocketEmitter | null;
export {};
//# sourceMappingURL=index.d.ts.map