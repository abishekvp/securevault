import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import SystemNotification from '@/models/SystemNotification';
import User from '@/models/User';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    const notifications = await SystemNotification.find({ userId: user._id }).sort({ createdAt: -1 });
    return NextResponse.json({ notifications });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new NextResponse('Missing notification ID', { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    await SystemNotification.findOneAndDelete({ _id: id, userId: user._id });
    return NextResponse.json({ success: true });
}
