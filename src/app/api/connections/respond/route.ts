import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { targetUserId, action } = await req.json(); // action: 'accept' | 'block' | 'reject'

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    const target = await User.findById(targetUserId);

    if (!user) return new NextResponse('User not found', { status: 404 });
    if (!target) return new NextResponse('Target user not found', { status: 404 });

    const myConnIndex = user.connections?.findIndex((c: any) => c.userId.toString() === targetUserId);
    const targetConnIndex = target.connections?.findIndex((c: any) => c.userId.toString() === user._id.toString());

    if (myConnIndex === undefined || targetConnIndex === undefined || myConnIndex === -1 || targetConnIndex === -1) {
        return new NextResponse('Connection request not found', { status: 404 });
    }

    if (user.connections && target.connections) {
        if (action === 'accept') {
            user.connections[myConnIndex].status = 'accepted';
            target.connections[targetConnIndex].status = 'accepted';
        } else if (action === 'reject') {
            user.connections.splice(myConnIndex, 1);
            target.connections.splice(targetConnIndex, 1);
        } else if (action === 'block') {
            user.connections[myConnIndex].status = 'blocked';
            // If I block them, remove me from their list? Or keep as blocked?
            // Usually, if I block someone, I don't want to see them.
            // And they shouldn't see me or know I blocked them (maybe just remove).
            // Let's remove me from them.
            target.connections.splice(targetConnIndex, 1);
        }
        await user.save();
        await target.save();
    } else {
        return new NextResponse('Connection data error', { status: 500 });
    }

    return NextResponse.json({ success: true });
}
