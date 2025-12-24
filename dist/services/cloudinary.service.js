import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';
// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});
class CloudinaryService {
    /**
     * Upload a file buffer to Cloudinary
     */
    async uploadBuffer(buffer, filename, options = {}) {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: options.folder || 'task-manager',
                resource_type: options.resourceType || 'auto',
                public_id: options.publicId,
                transformation: options.transformation,
            };
            const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    reject(error);
                }
                else if (result) {
                    resolve({
                        publicId: result.public_id,
                        url: result.url,
                        secureUrl: result.secure_url,
                        format: result.format,
                        resourceType: result.resource_type,
                        bytes: result.bytes,
                        width: result.width,
                        height: result.height,
                        originalFilename: filename,
                    });
                }
                else {
                    reject(new Error('Upload failed - no result returned'));
                }
            });
            uploadStream.end(buffer);
        });
    }
    /**
     * Upload a file from a base64 string
     */
    async uploadBase64(base64Data, filename, options = {}) {
        const result = await cloudinary.uploader.upload(`data:application/octet-stream;base64,${base64Data}`, {
            folder: options.folder || 'task-manager',
            resource_type: options.resourceType || 'auto',
            public_id: options.publicId,
        });
        return {
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            originalFilename: filename,
        };
    }
    /**
     * Delete a file from Cloudinary
     */
    async delete(publicId, resourceType = 'image') {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result.result === 'ok';
    }
    /**
     * Generate a signed URL for private files
     */
    generateSignedUrl(publicId, options = {}) {
        const expiresAt = Math.floor(Date.now() / 1000) + (options.expiresIn || 3600); // Default 1 hour
        return cloudinary.url(publicId, {
            secure: true,
            sign_url: true,
            type: 'authenticated',
            expires_at: expiresAt,
        });
    }
    /**
     * Generate a download URL
     */
    getDownloadUrl(publicId, filename) {
        return cloudinary.url(publicId, {
            secure: true,
            resource_type: 'raw',
            flags: 'attachment',
            // Use the original filename for download
            ...(filename && {
                attachment: filename
            }),
        });
    }
    /**
     * Get optimized image URL with transformations
     */
    getOptimizedImageUrl(publicId, options = {}) {
        return cloudinary.url(publicId, {
            secure: true,
            width: options.width,
            height: options.height,
            crop: options.crop || 'fill',
            quality: options.quality || 'auto',
            format: options.format || 'auto',
        });
    }
    /**
     * Check if Cloudinary is configured
     */
    isConfigured() {
        return !!(config.cloudinary.cloudName &&
            config.cloudinary.apiKey &&
            config.cloudinary.apiSecret);
    }
}
export const cloudinaryService = new CloudinaryService();
//# sourceMappingURL=cloudinary.service.js.map