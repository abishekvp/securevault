import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import SystemSettings from '@/models/SystemSettings';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otpCode = otp;
    user.otpExpires = expires;
    await user.save();

    // Send Email
    const configSetting = await SystemSettings.findOne({ key: 'email_config' });
    const config = configSetting?.value || {};

    if (config.smtpHost) {
        try {
            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: Number(config.smtpPort) || 587,
                secure: Number(config.smtpPort) === 465, // true for 465, false for other ports
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            });

            await transporter.sendMail({
                from: config.smtpFrom || 'noreply@securevault.com',
                to: user.email,
                subject: 'Secure Vault - Verification Code',
                text: `Your verification code is: ${otp}`,
                html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
            });
        } catch (e) {
            console.error("Mail send failed", e);
            // In dev, we might just log it
            if (process.env.NODE_ENV === 'development') {
                console.log("DEV: OTP IS", otp);
                return NextResponse.json({ success: true, dev_otp: otp });
            }
            return new NextResponse('Failed to send verification email', { status: 500 });
        }
    } else {
        if (process.env.NODE_ENV === 'development') {
            console.log("DEV: OTP IS", otp);
            return NextResponse.json({ success: true, dev_otp: otp });
        }
        return new NextResponse('SMTP not configured', { status: 500 });
    }

    return NextResponse.json({ success: true });
}
