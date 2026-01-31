import nodemailer from 'nodemailer';
import connectDB from './db';
import SystemSettings from '@/models/SystemSettings';

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
    await connectDB();

    // Fetch SMTP config
    const configSetting = await SystemSettings.findOne({ key: 'email_config' });
    const config = configSetting?.value || {};

    if (!config.smtpHost) {
        console.warn('SMTP Settings not configured. Email mocked:', { to, subject, text });
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: Number(config.smtpPort) || 587,
        secure: Number(config.smtpPort) === 465, // true for 465, false for other ports
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: config.smtpFrom || '"Secure Vault" <noreply@securevault.com>',
            to,
            subject,
            text,
            html,
        });
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
