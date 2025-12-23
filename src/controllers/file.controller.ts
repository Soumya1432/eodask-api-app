import type { Response } from 'express';
import { fileService } from '../services/file.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from '../types/index.js';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface MulterRequest extends AuthRequest {
  file?: MulterFile;
  files?: MulterFile[];
}

export const uploadTaskAttachment = asyncHandler(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const result = await fileService.uploadTaskAttachment(
    req.file,
    req.params.taskId,
    req.user!.id
  );

  sendSuccess(res, 'File uploaded', result, 201);
});

export const uploadAvatar = asyncHandler(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const avatarUrl = await fileService.uploadAvatar(req.file, req.user!.id);
  sendSuccess(res, 'Avatar uploaded', { avatar: avatarUrl });
});

export const getTaskAttachments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attachments = await fileService.getTaskAttachments(req.params.taskId);
  sendSuccess(res, 'Attachments retrieved', attachments);
});

export const deleteAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  await fileService.deleteAttachment(req.params.attachmentId, req.user!.id);
  sendSuccess(res, 'Attachment deleted');
});

export const downloadAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const downloadUrl = await fileService.getDownloadUrl(req.params.attachmentId);
  sendSuccess(res, 'Download URL generated', { downloadUrl });
});
