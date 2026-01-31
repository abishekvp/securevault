import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password, name, username } = await req.json();

        if (!email || !password || password.length < 6 || !username) {
            return new NextResponse('Invalid input', { status: 400 });
        }

        await connectDB();

        // Check for public signups allowed
        const { getSetting } = await import('@/lib/settings');
        const allowSignups = await getSetting<boolean>('site.allow_signups');

        if (allowSignups === false) {
            return new NextResponse('Public signups are currently disabled', { status: 403 });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return new NextResponse('User with this email or username already exists', { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await User.create({
            email,
            username,
            name,
            passwordHash,
            provider: 'credentials',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signup Error', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
