export declare class ChatService {
    createRoom(name: string | undefined, projectId: string | undefined, participantIds: string[], isGroup: boolean): Promise<any>;
    getOrCreateDirectChat(userId1: string, userId2: string): Promise<any>;
    getUserRooms(userId: string): Promise<any[]>;
    getRoomById(roomId: string, userId: string): Promise<any>;
    getMessages(roomId: string, userId: string, page?: number, limit?: number): Promise<{
        messages: {
            id: string;
            content: string;
            roomId: string;
            senderId: string;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            sender: {
                id: string;
                name: string;
                email: string | undefined;
                avatar: string | null;
            };
        }[];
        total: number;
    }>;
    sendMessage(roomId: string, senderId: string, content: string): Promise<{
        id: string;
        content: string;
        roomId: string;
        senderId: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        sender: {
            id: string;
            name: string;
            email: string | undefined;
            avatar: string | null;
        };
    }>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
    addParticipant(roomId: string, userId: string, newParticipantId: string): Promise<void>;
    removeParticipant(roomId: string, userId: string, participantId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
export declare const chatService: ChatService;
//# sourceMappingURL=chat.service.d.ts.map