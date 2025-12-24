import { fileService } from '../services/file.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
export const uploadTaskAttachment = asyncHandler(async (req, res) => {
    const multerReq = req;
    if (!multerReq.file) {
        throw ApiError.badRequest('No file uploaded');
    }
    const result = await fileService.uploadTaskAttachment(multerReq.file, req.params.taskId, multerReq.user.id);
    sendSuccess(res, 'File uploaded', result, 201);
});
export const uploadAvatar = asyncHandler(async (req, res) => {
    const multerReq = req;
    if (!multerReq.file) {
        throw ApiError.badRequest('No file uploaded');
    }
    const avatarUrl = await fileService.uploadAvatar(multerReq.file, multerReq.user.id);
    sendSuccess(res, 'Avatar uploaded', { avatar: avatarUrl });
});
export const getTaskAttachments = asyncHandler(async (req, res) => {
    const attachments = await fileService.getTaskAttachments(req.params.taskId);
    sendSuccess(res, 'Attachments retrieved', attachments);
});
export const deleteAttachment = asyncHandler(async (req, res) => {
    await fileService.deleteAttachment(req.params.attachmentId, req.user.id);
    sendSuccess(res, 'Attachment deleted');
});
export const downloadAttachment = asyncHandler(async (req, res) => {
    const downloadUrl = await fileService.getDownloadUrl(req.params.attachmentId);
    sendSuccess(res, 'Download URL generated', { downloadUrl });
});
//# sourceMappingURL=file.controller.js.map