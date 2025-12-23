import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as fileController from '../controllers/file.controller.js';

const router = Router();

// Configure multer to use memory storage for Cloudinary uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for avatars
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Avatar must be an image file'));
    }
  },
});

const taskIdSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID'),
  }),
});

const attachmentIdSchema = z.object({
  params: z.object({
    attachmentId: z.string().uuid('Invalid attachment ID'),
  }),
});

// All routes require authentication
router.use(authenticate);

// Task attachments
router.post(
  '/tasks/:taskId/attachments',
  validate(taskIdSchema),
  upload.single('file'),
  fileController.uploadTaskAttachment
);

router.get(
  '/tasks/:taskId/attachments',
  validate(taskIdSchema),
  fileController.getTaskAttachments
);

// Attachment operations
router.get(
  '/attachments/:attachmentId/download',
  validate(attachmentIdSchema),
  fileController.downloadAttachment
);

router.delete(
  '/attachments/:attachmentId',
  validate(attachmentIdSchema),
  fileController.deleteAttachment
);

// Avatar upload
router.post('/avatar', avatarUpload.single('avatar'), fileController.uploadAvatar);

export default router;
