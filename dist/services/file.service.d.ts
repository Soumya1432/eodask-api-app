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
declare class FileService {
    validateFile(file: UploadedFile): void;
    private getResourceType;
    uploadTaskAttachment(file: UploadedFile, taskId: string, uploaderId: string): Promise<FileUploadResult>;
    uploadAvatar(file: UploadedFile, userId: string): Promise<string>;
    getAttachment(attachmentId: string): Promise<{
        path: string;
        filename: string;
        mimeType: string;
    }>;
    getDownloadUrl(attachmentId: string): Promise<string>;
    deleteAttachment(attachmentId: string, userId: string): Promise<void>;
    getTaskAttachments(taskId: string): Promise<FileUploadResult[]>;
    /**
     * Upload organization logo
     */
    uploadOrganizationLogo(file: UploadedFile, organizationId: string): Promise<string>;
}
export declare const fileService: FileService;
export {};
//# sourceMappingURL=file.service.d.ts.map