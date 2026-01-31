import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { password } = await req.json();
    if (!password) return new NextResponse('Password is required to disable 2FA', { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('+passwordHash');
    if (!user) return new NextResponse('User not found', { status: 404 });

    if (!user.passwordHash) {
        return new NextResponse('Social accounts cannot disable 2FA this way', { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return new NextResponse('Invalid password', { status: 400 });

    await User.updateOne({ _id: user._id }, {
        is2FAEnabled: false,
        $unset: { twoFactorSecret: 1 }
    });

    return NextResponse.json({ success: true });
}
