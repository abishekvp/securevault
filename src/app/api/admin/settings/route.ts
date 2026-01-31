import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { key, value } = body;

        const updated = await SystemSettings.findOneAndUpdate(
            { key },
            { key, value, updatedBy: user.email, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        // Check admin? Or maybe some settings are public? For now restrict to admin.
        const user = await User.findOne({ email: session.user.email });
        if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

        const setting = await SystemSettings.findOne({ key });
        return NextResponse.json(setting || {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
