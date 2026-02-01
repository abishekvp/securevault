import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { NextResponse } from 'next/server';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const User = (await import('@/models/User')).default;
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) return new NextResponse('User not found', { status: 404 });

    const group = await Group.findById(params.id);
    if (!group) return new NextResponse('Group not found', { status: 404 });

    const memberIndex = group.members.findIndex((m: any) => m.userId.toString() === currentUser._id.toString());
    if (memberIndex === -1) {
        return new NextResponse('Not a member', { status: 403 });
    }

    if (group.members[memberIndex].status === 'active') {
        return new NextResponse('Already active', { status: 400 });
    }

    group.members[memberIndex].status = 'active';
    await group.save();

    return NextResponse.json({ success: true });
}
