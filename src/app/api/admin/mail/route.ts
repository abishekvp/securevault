import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import MailSettings from '@/models/MailSettings';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// Middleware-like check for admin
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.isAdmin) return null;
    return true;
}

export async function GET(req: Request) {
    if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });
    await connectDB();
    const settings = await MailSettings.findOne({});
    return NextResponse.json({ config: settings || {} });
}

export async function POST(req: Request) {
    if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });
    await connectDB();
    const config = await req.json();

    // Basic validation
    if (!config.host || !config.port || !config.user || !config.pass) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    // Upsert the single mail config document
    await MailSettings.findOneAndUpdate(
        {},
        { ...config },
        { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
}
