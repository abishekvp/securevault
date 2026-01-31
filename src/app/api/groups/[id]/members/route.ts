import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { targetUserId, encryptedGroupKey, role } = await req.json();

    await connectDB();
    const User = (await import('@/models/User')).default;
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) return new NextResponse('User not found', { status: 404 });
    const targetUser = await User.findById(targetUserId).select('+privacySettings +connections');
    if (!targetUser) return new NextResponse('Target user not found', { status: 404 });

    const group = await Group.findById(params.id);
    if (!group) return new NextResponse('Group not found', { status: 404 });

    // Check if current user is admin/owner
    const member = group.members.find((m: any) => m.userId.toString() === currentUser._id.toString());
    if (!member || member.role !== 'admin') {
        return new NextResponse('Only admins can invite', { status: 403 });
    }

    // Check if target already exists
    const existing = group.members.find((m: any) => m.userId.toString() === targetUserId);
    if (existing) {
        return new NextResponse('User already in group', { status: 409 });
    }


    // Auto-Join Logic
    let status = 'invited';
    const privacy = targetUser.privacySettings;

    if (privacy) {
        if (privacy.autoJoinGroups === 'connections') {
            const isConnected = targetUser.connections.some((c: any) =>
                c.userId.toString() === currentUser._id.toString() && c.status === 'accepted'
            );
            if (isConnected) status = 'active';
        } else if (privacy.autoJoinGroups === 'specific') {
            const isWhitelisted = privacy.autoJoinWhitelist?.some((id: any) =>
                id.toString() === currentUser._id.toString()
            );
            if (isWhitelisted) status = 'active';
        }
    }

    group.members.push({
        userId: targetUserId,
        role: role || 'viewer',
        status,
        encryptedGroupKey // Provide the key encrypted for the target
    });

    await group.save();

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    // Remove member logic... (skip for brevity unless needed)
    return new NextResponse('Not implemented', { status: 501 });
}
