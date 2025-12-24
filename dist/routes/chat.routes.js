import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as chatController from '../controllers/chat.controller.js';
const router = Router();
const createRoomSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Room name is required').max(100),
        projectId: z.string().uuid('Invalid project ID').optional(),
        participantIds: z.array(z.string().uuid()).optional().default([]),
        isGroup: z.boolean().optional().default(true),
    }),
});
const userIdSchema = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID'),
    }),
});
const roomIdSchema = z.object({
    params: z.object({
        roomId: z.string().uuid('Invalid room ID'),
    }),
});
const messageIdSchema = z.object({
    params: z.object({
        messageId: z.string().uuid('Invalid message ID'),
    }),
});
const sendMessageSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'Message content is required').max(5000),
    }),
    params: z.object({
        roomId: z.string().uuid('Invalid room ID'),
    }),
});
const addParticipantSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
    }),
    params: z.object({
        roomId: z.string().uuid('Invalid room ID'),
    }),
});
const removeParticipantSchema = z.object({
    params: z.object({
        roomId: z.string().uuid('Invalid room ID'),
        userId: z.string().uuid('Invalid user ID'),
    }),
});
const messagesQuerySchema = z.object({
    params: z.object({
        roomId: z.string().uuid('Invalid room ID'),
    }),
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }).optional(),
});
// All routes require authentication
router.use(authenticate);
// Room management
router.get('/', chatController.getRooms);
router.post('/', validate(createRoomSchema), chatController.createRoom);
router.get('/direct/:userId', validate(userIdSchema), chatController.getOrCreateDirectChat);
router.get('/unread', chatController.getUnreadCount);
router.get('/:roomId', validate(roomIdSchema), chatController.getRoom);
// Messages
router.get('/:roomId/messages', validate(messagesQuerySchema), chatController.getMessages);
router.post('/:roomId/messages', validate(sendMessageSchema), chatController.sendMessage);
router.delete('/messages/:messageId', validate(messageIdSchema), chatController.deleteMessage);
// Participants
router.post('/:roomId/participants', validate(addParticipantSchema), chatController.addParticipant);
router.delete('/:roomId/participants/:userId', validate(removeParticipantSchema), chatController.removeParticipant);
export default router;
//# sourceMappingURL=chat.routes.js.map