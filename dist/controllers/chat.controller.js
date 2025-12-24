import { chatService } from '../services/chat.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
export const createRoom = asyncHandler(async (req, res) => {
    const { name, projectId, participantIds, isGroup } = req.body;
    const room = await chatService.createRoom(name, projectId, [...participantIds, req.user.id], isGroup);
    sendSuccess(res, 'Chat room created', room, 201);
});
export const getOrCreateDirectChat = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const room = await chatService.getOrCreateDirectChat(req.user.id, userId);
    sendSuccess(res, 'Chat room retrieved', room);
});
export const getRooms = asyncHandler(async (req, res) => {
    const rooms = await chatService.getUserRooms(req.user.id);
    sendSuccess(res, 'Chat rooms retrieved', rooms);
});
export const getRoom = asyncHandler(async (req, res) => {
    const room = await chatService.getRoomById(req.params.roomId, req.user.id);
    sendSuccess(res, 'Chat room retrieved', room);
});
export const getMessages = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { messages, total } = await chatService.getMessages(req.params.roomId, req.user.id, page, limit);
    sendPaginated(res, 'Messages retrieved', messages, { page, limit, total });
});
export const sendMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const message = await chatService.sendMessage(req.params.roomId, req.user.id, content);
    sendSuccess(res, 'Message sent', message, 201);
});
export const deleteMessage = asyncHandler(async (req, res) => {
    await chatService.deleteMessage(req.params.messageId, req.user.id);
    sendSuccess(res, 'Message deleted');
});
export const addParticipant = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    await chatService.addParticipant(req.params.roomId, req.user.id, userId);
    sendSuccess(res, 'Participant added');
});
export const removeParticipant = asyncHandler(async (req, res) => {
    await chatService.removeParticipant(req.params.roomId, req.user.id, req.params.userId);
    sendSuccess(res, 'Participant removed');
});
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await chatService.getUnreadCount(req.user.id);
    sendSuccess(res, 'Unread count retrieved', { count });
});
//# sourceMappingURL=chat.controller.js.map