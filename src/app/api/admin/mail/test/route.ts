import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.isAdmin) return new NextResponse('Unauthorized', { status: 403 });

    // Get config from DB (or allow passing potentially unsaved config for testing?)
    // Typically, "Test" uses the *current* unsaved values from the form to verify them before saving.
    const body = await req.json();
    const { host, port, user: smtpUser, pass, secure, from } = body;

    if (!host || !port || !smtpUser || !pass) {
        return new NextResponse('Missing SMTP details', { status: 400 });
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: Number(port),
            secure: secure || false,
            auth: {
                user: smtpUser,
                pass: pass,
            },
        });

        await transporter.verify();
        await transporter.sendMail({
            from: from || smtpUser,
            to: session.user.email,
            subject: 'Secure Vault - Test Email',
            text: 'If you are reading this, your SMTP configuration is working correctly.',
            html: '<p>If you are reading this, your <b>SMTP configuration</b> is working correctly.</p>'
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("SMTP Test Failed:", e);
        return new NextResponse(`SMTP Connection Failed: ${e.message}`, { status: 500 });
    }
}
