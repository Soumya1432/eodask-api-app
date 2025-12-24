import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

// Helper to format user with full name
const formatUser = (user: { id: string; firstName: string | null; lastName: string | null; email?: string; avatar: string | null }) => ({
  id: user.id,
  name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User',
  email: user.email,
  avatar: user.avatar,
});

// Helper to format participants with user name
const formatParticipants = (participants: Array<{
  id: string;
  userId: string;
  chatRoomId: string;
  joinedAt: Date;
  lastReadAt: Date;
  user: { id: string; firstName: string | null; lastName: string | null; avatar: string | null };
}>) => participants.map(p => ({
  id: p.id,
  userId: p.userId,
  roomId: p.chatRoomId,
  joinedAt: p.joinedAt.toISOString(),
  user: formatUser(p.user),
}));

// Helper to format room with last message
const formatRoom = (room: any) => {
  const formattedRoom: any = {
    id: room.id,
    name: room.name,
    isGroup: room.isGroup,
    projectId: room.projectId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    participants: room.participants ? formatParticipants(room.participants) : [],
  };

  if (room.messages && room.messages.length > 0) {
    const lastMsg = room.messages[0];
    formattedRoom.lastMessage = {
      id: lastMsg.id,
      content: lastMsg.content,
      roomId: lastMsg.chatRoomId,
      senderId: lastMsg.senderId,
      createdAt: lastMsg.createdAt,
      updatedAt: lastMsg.updatedAt,
      isDeleted: lastMsg.isDeleted || false,
      sender: lastMsg.sender ? formatUser(lastMsg.sender) : undefined,
    };
  }

  return formattedRoom;
};

export class ChatService {
  async createRoom(
    name: string | undefined,
    projectId: string | undefined,
    participantIds: string[],
    isGroup: boolean
  ) {
    const room = await prisma.chatRoom.create({
      data: {
        name,
        projectId,
        isGroup,
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    return formatRoom(room);
  }

  async getOrCreateDirectChat(userId1: string, userId2: string) {
    // Find existing direct chat between these two users
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (existingRoom) {
      return formatRoom(existingRoom);
    }

    // Create new direct chat
    return this.createRoom(undefined, undefined, [userId1, userId2], false);
  }

  async getUserRooms(userId: string) {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map(formatRoom);
  }

  async getRoomById(roomId: string, userId: string) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!room) {
      throw ApiError.notFound('Chat room not found');
    }

    // Check if user is participant
    const isParticipant = room.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw ApiError.forbidden('Not a participant of this chat');
    }

    return formatRoom(room);
  }

  async getMessages(roomId: string, userId: string, page = 1, limit = 50) {
    // Verify access
    await this.getRoomById(roomId, userId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { chatRoomId: roomId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatMessage.count({ where: { chatRoomId: roomId } }),
    ]);

    // Update last read
    await prisma.chatParticipant.updateMany({
      where: {
        chatRoomId: roomId,
        userId,
      },
      data: { lastReadAt: new Date() },
    });

    // Format messages with proper user name
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      content: msg.content,
      roomId: msg.chatRoomId,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      isDeleted: false,
      sender: formatUser(msg.sender),
    }));

    return { messages: formattedMessages, total };
  }

  async sendMessage(roomId: string, senderId: string, content: string) {
    // Verify access
    await this.getRoomById(roomId, senderId);

    const message = await prisma.chatMessage.create({
      data: {
        content,
        chatRoomId: roomId,
        senderId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update room's updatedAt
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Create notifications for other participants
    const participants = await prisma.chatParticipant.findMany({
      where: {
        chatRoomId: roomId,
        userId: { not: senderId },
      },
    });

    const senderName = formatUser(message.sender).name;

    await prisma.notification.createMany({
      data: participants.map((p) => ({
        type: 'CHAT_MESSAGE' as const,
        title: 'New Message',
        message: `New message from ${senderName}`,
        userId: p.userId,
        metadata: { chatRoomId: roomId, messageId: message.id },
      })),
    });

    // Return formatted message
    return {
      id: message.id,
      content: message.content,
      roomId: message.chatRoomId,
      senderId: message.senderId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isDeleted: false,
      sender: formatUser(message.sender),
    };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    if (message.senderId !== userId) {
      throw ApiError.forbidden('Can only delete own messages');
    }

    await prisma.chatMessage.delete({
      where: { id: messageId },
    });
  }

  async addParticipant(roomId: string, userId: string, newParticipantId: string) {
    const room = await this.getRoomById(roomId, userId);

    if (!room.isGroup) {
      throw ApiError.badRequest('Cannot add participants to direct chat');
    }

    // Check if already participant
    const existing = room.participants.find((p:any) => p.userId === newParticipantId);
    if (existing) {
      throw ApiError.conflict('User is already a participant');
    }

    await prisma.chatParticipant.create({
      data: {
        chatRoomId: roomId,
        userId: newParticipantId,
      },
    });
  }

  async removeParticipant(roomId: string, userId: string, participantId: string) {
    const room = await this.getRoomById(roomId, userId);

    if (!room.isGroup) {
      throw ApiError.badRequest('Cannot remove participants from direct chat');
    }

    await prisma.chatParticipant.delete({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: participantId,
        },
      },
    });
  }

  async getUnreadCount(userId: string) {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          where: { userId },
        },
        messages: true,
      },
    });

    let totalUnread = 0;

    for (const room of rooms) {
      const participant = room.participants[0];
      if (participant) {
        const unreadCount = room.messages.filter(
          (m) => m.createdAt > participant.lastReadAt && m.senderId !== userId
        ).length;
        totalUnread += unreadCount;
      }
    }

    return totalUnread;
  }
}

export const chatService = new ChatService();
