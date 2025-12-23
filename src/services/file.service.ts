import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { cloudinaryService } from './cloudinary.service.js';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

const ALLOWED_MIME_TYPES = [
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
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class FileService {
  validateFile(file: UploadedFile): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw ApiError.badRequest(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw ApiError.badRequest(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  private getResourceType(mimetype: string): 'image' | 'video' | 'raw' | 'auto' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw';
  }

  async uploadTaskAttachment(
    file: UploadedFile,
    taskId: string,
    uploaderId: string
  ): Promise<FileUploadResult> {
    this.validateFile(file);

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname,
      {
        folder: `task-manager/attachments/${taskId}`,
        resourceType: this.getResourceType(file.mimetype),
      }
    );

    // Create attachment record with Cloudinary info
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileName: uploadResult.publicId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.secureUrl, // Store the secure URL
        uploadedById: uploaderId,
      },
    });

    return {
      id: attachment.id,
      filename: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: uploadResult.secureUrl,
    };
  }

  async uploadAvatar(file: UploadedFile, userId: string): Promise<string> {
    // Validate image type
    if (!file.mimetype.startsWith('image/')) {
      throw ApiError.badRequest('Avatar must be an image file');
    }

    this.validateFile(file);

    // Get current user to check if they have an existing avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Delete old avatar from Cloudinary if it exists and is a Cloudinary URL
    if (user?.avatar && user.avatar.includes('cloudinary.com')) {
      const publicIdMatch = user.avatar.match(/\/task-manager\/avatars\/([^/]+)\./);
      if (publicIdMatch) {
        try {
          await cloudinaryService.delete(`task-manager/avatars/${publicIdMatch[1]}`, 'image');
        } catch (error) {
          console.error('Error deleting old avatar:', error);
        }
      }
    }

    // Upload to Cloudinary with optimization
    const uploadResult = await cloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname,
      {
        folder: 'task-manager/avatars',
        resourceType: 'image',
        transformation: [
          { width: 256, height: 256, crop: 'fill', gravity: 'face' },
          { quality: 'auto', format: 'auto' },
        ],
      }
    );

    // Update user avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.secureUrl },
    });

    return uploadResult.secureUrl;
  }

  async getAttachment(attachmentId: string): Promise<{
    path: string;
    filename: string;
    mimeType: string;
  }> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    return {
      path: attachment.url,
      filename: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  async getDownloadUrl(attachmentId: string): Promise<string> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    // If it's a Cloudinary URL, generate a download URL
    if (attachment.url.includes('cloudinary.com')) {
      return cloudinaryService.getDownloadUrl(
        attachment.fileName,
        attachment.originalName
      );
    }

    // Fallback to stored path for legacy files
    return attachment.url;
  }

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId },
                  select: { role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    // Check permission: uploader or project admin/manager
    const isUploader = attachment.uploadedById === userId;
    const memberRole = attachment.task.project.members[0]?.role;
    const canDelete = isUploader || memberRole === 'ADMIN' || memberRole === 'MANAGER';

    if (!canDelete) {
      throw ApiError.forbidden('You do not have permission to delete this attachment');
    }

    // Delete file from Cloudinary
    if (attachment.url.includes('cloudinary.com')) {
      try {
        const resourceType = attachment.mimeType.startsWith('image/') ? 'image' : 'raw';
        await cloudinaryService.delete(attachment.fileName, resourceType);
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
      }
    }

    // Delete record
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });
  }

  async getTaskAttachments(taskId: string): Promise<FileUploadResult[]> {
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map((attachment) => ({
      id: attachment.id,
      filename: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: attachment.url, // Use the stored Cloudinary URL
    }));
  }

  /**
   * Upload organization logo
   */
  async uploadOrganizationLogo(file: UploadedFile, organizationId: string): Promise<string> {
    // Validate image type
    if (!file.mimetype.startsWith('image/')) {
      throw ApiError.badRequest('Logo must be an image file');
    }

    this.validateFile(file);

    // Get current organization to check if they have an existing logo
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { logo: true },
    });

    // Delete old logo from Cloudinary if it exists
    if (organization?.logo && organization.logo.includes('cloudinary.com')) {
      const publicIdMatch = organization.logo.match(/\/task-manager\/logos\/([^/]+)\./);
      if (publicIdMatch) {
        try {
          await cloudinaryService.delete(`task-manager/logos/${publicIdMatch[1]}`, 'image');
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }
    }

    // Upload to Cloudinary with optimization
    const uploadResult = await cloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname,
      {
        folder: 'task-manager/logos',
        resourceType: 'image',
        transformation: [
          { width: 512, height: 512, crop: 'fill' },
          { quality: 'auto', format: 'auto' },
        ],
      }
    );

    // Update organization logo
    await prisma.organization.update({
      where: { id: organizationId },
      data: { logo: uploadResult.secureUrl },
    });

    return uploadResult.secureUrl;
  }
}

export const fileService = new FileService();
