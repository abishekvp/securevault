import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email, type } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email });

        if (!user) {
            // For security, don't reveal user existence.
            // But if type is 'signup' we might want to error differently?
            // For now, behave as if sent.
            return NextResponse.json({ message: 'OTP sent if account exists' });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to user (using findByIdAndUpdate to access hidden fields if needed, 
        // though we are writing so it's fine)
        await User.findByIdAndUpdate(user._id, {
            otpCode: otp,
            otpExpires: expires
        });

        // Send Email
        const subject = type === 'login' ? 'Your Login OTP' : 'Verify Your Email';
        const text = `Your One-Time Password is: ${otp}. It expires in 10 minutes.`;

        const sent = await sendEmail({
            to: email,
            subject,
            text,
        });

        // Log OTP for Dev/Admin access if email fails (or always for now in dev)
        console.log(`[OTP-DEBUG] For ${email}: ${otp}`);

        if (!sent) {
            console.error('Failed to send OTP email, but OTP was saved. User can login if they know the OTP (Dev/Manual).');
            // Allow flow to continue even if email failed
            return NextResponse.json({ message: 'OTP generated (Email delivery failed)' });
        }

        return NextResponse.json({ message: 'OTP sent successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
