import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    // Find groups where user is a member (or owner, which is also a member typically)
    // Actually schema has ownerId separately, but owner should be in members list too for key distribution.
    // If not, we query by ownerId OR members.userId

    // Let's assume fetching groups where I am a member.
    // Since I might not be in members list if I am owner (depending on implementation), check both.

    // BUT: Best practice is owner is also a member with 'admin' role.

    // We need to find User ID first.
    // Since we don't have it easily from session (only email), better to populate or look it up.
    // But `members.userId` is ObjectId.
    // We can lookup user by email first.

    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    const groups = await Group.find({ 'members.userId': user._id })
        .populate('members.userId', 'name email username image')
        .populate('ownerId', 'name email');

    return NextResponse.json({ groups });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { name, encryptedGroupKey } = await req.json(); // encryptedGroupKey here is encrypted with CREATOR'S Public Key (so creator can read it)
    // Actually, creator has the raw key in memory during creation. 
    // They should encrypt it for THEMSELVES (via their Public Key) and store it in their member entry.

    await connectDB();
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    const newGroup = await Group.create({
        name,
        ownerId: user._id,
        members: [{
            userId: user._id,
            role: 'admin',
            status: 'active',
            encryptedGroupKey // Encrypted by Creator for Creator
        }]
    });

    return NextResponse.json({ success: true, group: newGroup });
}
