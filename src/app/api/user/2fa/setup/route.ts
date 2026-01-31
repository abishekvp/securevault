import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import * as OTPAuth from "otpauth";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    if (user.is2FAEnabled) {
        return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    // Generate a new TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
        issuer: "SecureVault",
        label: user.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: secret
    });

    const uri = totp.toString();
    const b32Secret = secret.base32;

    // Temporarily save secret to user (not yet enabled)
    await User.updateOne({ _id: user._id }, { twoFactorSecret: b32Secret });

    return NextResponse.json({
        secret: b32Secret,
        uri: uri
    });
}
