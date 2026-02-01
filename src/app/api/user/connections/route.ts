import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

// GET: List all connections
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const user = await User.findOne({ email: session.user.email })
            .populate('connections.userId', 'name email image username publicKey');

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ connections: user.connections || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Send Request
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { targetEmail } = await req.json();
        if (targetEmail === session.user.email) return NextResponse.json({ error: 'Cannot connect with self' }, { status: 400 });

        await connectDB();

        const sender = await User.findOne({ email: session.user.email });
        if (!sender) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const recipient = await User.findOne({ email: targetEmail });

        if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Check availability
        const existing = (sender.connections || []).find((c: any) => c.userId?.toString() === recipient._id.toString());
        if (existing) return NextResponse.json({ error: `Connection already ${existing.status}` }, { status: 409 });

        // Update Sender: status 'sent'
        // Update Recipient: status 'pending' (incoming)

        await User.findByIdAndUpdate(sender._id, {
            $push: { connections: { userId: recipient._id, status: 'sent' } }
        });

        await User.findByIdAndUpdate(recipient._id, {
            $push: { connections: { userId: sender._id, status: 'pending', publicKey: sender.publicKey } }
            // We cache sender public key here if available? 
            // Best to fetch live from 'populate', but storing a snapshot is ok. 
            // Schema has 'publicKey', let's leave it null and rely on populate for now.
        });

        return NextResponse.json({ message: 'Request sent' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Accept/Block Request
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { targetUserId, action } = await req.json(); // action: 'accept' | 'block' | 'reject'

        await connectDB();
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (action === 'accept') {
            // 1. Update Current User: pending -> accepted
            await User.updateOne(
                { _id: currentUser._id, 'connections.userId': targetUserId },
                { $set: { 'connections.$.status': 'accepted' } }
            );

            // 2. Update Other User: sent -> accepted
            await User.updateOne(
                { _id: targetUserId, 'connections.userId': currentUser._id },
                { $set: { 'connections.$.status': 'accepted' } }
            );

            return NextResponse.json({ message: 'Connection accepted' });
        }

        // Handle reject/delete
        if (action === 'reject') {
            await User.findByIdAndUpdate(currentUser._id, { $pull: { connections: { userId: targetUserId } } });
            await User.findByIdAndUpdate(targetUserId, { $pull: { connections: { userId: currentUser._id } } });
            return NextResponse.json({ message: 'Connection removed' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
