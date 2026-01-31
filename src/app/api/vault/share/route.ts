import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Share from '@/models/Share';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { itemId, targetUserId, targetGroupId, encryptedItemKey } = await req.json();

        await connectDB();
        await connectDB();
        const sender = await User.findOne({ email: session.user.email });
        if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });

        if (targetGroupId) {
            // Group Share
            await Share.create({
                senderId: sender._id,
                groupId: targetGroupId,
                itemId: itemId,
                encryptedItemKey: encryptedItemKey
            });
        } else {
            // User Share
            // Confirm recipients exists
            const recipient = await User.findById(targetUserId);
            if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

            // Create Share Record
            await Share.create({
                senderId: sender._id,
                recipientId: targetUserId,
                itemId: itemId,
                encryptedItemKey: encryptedItemKey
            });
        }

        return NextResponse.json({ message: 'Item shared successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Fetch Incoming Shares
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // populate sender info and the actual item data (we need item data to show it!)
        // However, item data is encrypted. The recipient needs the 'encryptedItemKey' from the Share record
        // to decrypt it.
        const Group = (await import('@/models/Group')).default;
        const userGroups = await Group.find({ 'members.userId': user._id }).distinct('_id');

        const shares = await Share.find({
            $or: [
                { recipientId: user._id },
                { groupId: { $in: userGroups } }
            ]
        })
            .populate('senderId', 'name email')
            .populate('groupId', 'name')
            .populate('itemId');

        return NextResponse.json({ shares });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
