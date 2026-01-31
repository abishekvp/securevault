import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email })
        .populate('connections.userId', 'name email username image publicKey');

    // Transform connections to a cleaner format
    const connections = user?.connections?.map((c: any) => ({
        id: c.userId._id,
        name: c.userId.name,
        email: c.userId.email,
        username: c.userId.username,
        image: c.userId.image,
        publicKey: c.userId.publicKey,
        status: c.status,
        _id: c._id // Connection subdoc ID if needed
    })) || [];

    return NextResponse.json({ connections });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { targetEmailOrUsername } = await req.json();
    if (!targetEmailOrUsername) return new NextResponse('Missing target', { status: 400 });

    await connectDB();

    const sender = await User.findOne({ email: session.user.email });
    const target = await User.findOne({
        $or: [{ email: targetEmailOrUsername }, { username: targetEmailOrUsername }]
    }).select('+privacySettings');

    if (!sender || !target) return new NextResponse('User not found', { status: 404 });
    if (sender._id.equals(target._id)) return new NextResponse('Cannot connect to self', { status: 400 });

    // Check if connection already exists
    const existing = sender.connections?.find((c: any) => c.userId.toString() === target._id.toString());
    if (existing) {
        return new NextResponse('Connection already exists or pending', { status: 409 });
    }

    // Add request to BOTH users
    // Sender: Status 'sent' (Not generic pending, so they know they initiated)
    // Target: Status 'pending'

    // Actually, User model defines status enum: 'pending' | 'accepted' | 'blocked'. 
    // We can use 'pending' for incoming, and maybe 'sent' for outgoing if we add it to enum.
    // Let's check User model enum. 
    // It says: ['pending', 'sent', 'accepted', 'blocked'] in my previous view. 

    if (!sender.connections) sender.connections = [];
    if (!target.connections) target.connections = [];

    const shouldAutoAccept = target.privacySettings?.autoAcceptConnections;

    sender.connections.push({ userId: target._id, status: shouldAutoAccept ? 'accepted' : 'sent' });
    target.connections.push({ userId: sender._id, status: shouldAutoAccept ? 'accepted' : 'pending' });

    await sender.save();
    await target.save();

    return NextResponse.json({ success: true, status: shouldAutoAccept ? 'accepted' : 'pending' });
}
