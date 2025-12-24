import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
class EmailService {
    transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.port === 465,
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
        });
    }
    async sendEmail(options) {
        try {
            await this.transporter.sendMail({
                from: config.smtp.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
        }
        catch (error) {
            console.error('Email sending failed:', error);
            // Don't throw, just log - email is not critical
        }
    }
    async sendInvitation(email, projectName, senderName, inviteToken) {
        const inviteUrl = `${config.clientUrl}/invite/${inviteToken}`;
        await this.sendEmail({
            to: email,
            subject: `You've been invited to join ${projectName}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Project Invitation</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${senderName}</strong> has invited you to join the project <strong>${projectName}</strong> on onething.</p>
              <p>Click the button below to accept the invitation and join the team:</p>
              <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280;">${inviteUrl}</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} onething</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
    }
    async sendTaskAssignmentNotification(email, userName, taskTitle, projectName, taskUrl) {
        await this.sendEmail({
            to: email,
            subject: `New task assigned: ${taskTitle}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Task Assignment</h1>
            </div>
            <div class="content">
              <p>Hi ${userName}!</p>
              <p>You have been assigned a new task in <strong>${projectName}</strong>:</p>
              <h2 style="color: #1f2937;">${taskTitle}</h2>
              <p style="text-align: center;">
                <a href="${taskUrl}" class="button">View Task</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
    }
    async sendDeadlineReminder(email, userName, taskTitle, dueDate, taskUrl) {
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        await this.sendEmail({
            to: email,
            subject: `Reminder: Task "${taskTitle}" is due soon`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Deadline Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${userName}!</p>
              <p>This is a reminder that the following task is due soon:</p>
              <h2 style="color: #1f2937;">${taskTitle}</h2>
              <div class="deadline">
                <strong>Due: ${formattedDate}</strong>
              </div>
              <p style="text-align: center;">
                <a href="${taskUrl}" class="button">View Task</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
    }
    async sendTaskReminder(email, userName, taskTitle, projectName, dueDate) {
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        await this.sendEmail({
            to: email,
            subject: `Reminder: Task "${taskTitle}" is due tomorrow`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Task Due Tomorrow</h1>
            </div>
            <div class="content">
              <p>Hi ${userName}!</p>
              <p>This is a friendly reminder that the following task is due tomorrow:</p>
              <h2 style="color: #1f2937;">${taskTitle}</h2>
              <p>Project: <strong>${projectName}</strong></p>
              <div class="deadline">
                <strong>Due: ${formattedDate}</strong>
              </div>
              <p>Please make sure to complete it on time.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
    }
    async sendOrganizationInvitation(email, organizationName, senderName, role, inviteToken) {
        const inviteUrl = `${config.clientUrl}/invite/${inviteToken}`;
        await this.sendEmail({
            to: email,
            subject: `You've been invited to join ${organizationName}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .role-badge { display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 12px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Organization Invitation</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${senderName}</strong> has invited you to join <strong>${organizationName}</strong> on onething.</p>
              <p>You've been invited as: <span class="role-badge">${role}</span></p>
              <p>Click the button below to accept the invitation and join the team:</p>
              <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280;">${inviteUrl}</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} onething</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
    }
}
export const emailService = new EmailService();
//# sourceMappingURL=email.service.js.map