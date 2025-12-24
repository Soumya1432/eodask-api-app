export interface UploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    resourceType: string;
    bytes: number;
    width?: number;
    height?: number;
    originalFilename: string;
}
export interface UploadOptions {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: object[];
    publicId?: string;
}
declare class CloudinaryService {
    /**
     * Upload a file buffer to Cloudinary
     */
    uploadBuffer(buffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult>;
    /**
     * Upload a file from a base64 string
     */
    uploadBase64(base64Data: string, filename: string, options?: UploadOptions): Promise<UploadResult>;
    /**
     * Delete a file from Cloudinary
     */
    delete(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<boolean>;
    /**
     * Generate a signed URL for private files
     */
    generateSignedUrl(publicId: string, options?: {
        expiresIn?: number;
    }): string;
    /**
     * Generate a download URL
     */
    getDownloadUrl(publicId: string, filename: string): string;
    /**
     * Get optimized image URL with transformations
     */
    getOptimizedImageUrl(publicId: string, options?: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string;
        format?: string;
    }): string;
    /**
     * Check if Cloudinary is configured
     */
    isConfigured(): boolean;
}
export declare const cloudinaryService: CloudinaryService;
export {};
//# sourceMappingURL=cloudinary.service.d.ts.map