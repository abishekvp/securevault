import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import * as OTPAuth from "otpauth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { code } = await req.json();
    if (!code) return new NextResponse('Code is required', { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) return new NextResponse('Setup not initiated', { status: 400 });

    const totp = new OTPAuth.TOTP({
        issuer: "SecureVault",
        label: user.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: user.twoFactorSecret
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await User.updateOne({ _id: user._id }, { is2FAEnabled: true });

    return NextResponse.json({ success: true });
}
