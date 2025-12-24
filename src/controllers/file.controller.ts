import type { Request, Response } from 'express';
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

type MulterRequest = Request & {
  file?: MulterFile;
  user?: { id: string; email: string };
};

export const uploadTaskAttachment = asyncHandler(async (req: Request, res: Response) => {
  const multerReq = req as MulterRequest;
  if (!multerReq.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const result = await fileService.uploadTaskAttachment(
    multerReq.file,
    req.params.taskId,
    multerReq.user!.id
  );

  sendSuccess(res, 'File uploaded', result, 201);
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const multerReq = req as MulterRequest;
  if (!multerReq.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const avatarUrl = await fileService.uploadAvatar(multerReq.file, multerReq.user!.id);
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
