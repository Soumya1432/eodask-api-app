interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<void>;
    sendInvitation(email: string, projectName: string, senderName: string, inviteToken: string): Promise<void>;
    sendTaskAssignmentNotification(email: string, userName: string, taskTitle: string, projectName: string, taskUrl: string): Promise<void>;
    sendDeadlineReminder(email: string, userName: string, taskTitle: string, dueDate: Date, taskUrl: string): Promise<void>;
    sendTaskReminder(email: string, userName: string, taskTitle: string, projectName: string, dueDate: Date): Promise<void>;
    sendOrganizationInvitation(email: string, organizationName: string, senderName: string, role: string, inviteToken: string): Promise<void>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map