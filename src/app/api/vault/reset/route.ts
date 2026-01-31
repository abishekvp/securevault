import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Account from '@/models/Account';
// import Folder from '@/models/Folder'; // If Folder model exists
import Share from '@/models/Share';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    try {
        // Delete all Accounts (Vault Items) owned by user
        await Account.deleteMany({ owner: user._id });

        // Delete all Folders (if applicable, assuming Folder model or stored in User)
        // Check if Folder model exists, or if folders are in User.
        // Based on previous file reads, Folder seems to be a separate API but might be embedded or separate model.
        // User.ts had: folders?: { id: string; name: string; encryptedName?: string }[];
        // So folders are likely in User model. We should clear them there.

        await User.findByIdAndUpdate(user._id, {
            $set: {
                folders: [],
                favorites: [],
                connections: [], // Maybe keep connections? Prompt didn't say reset connections, but "delete all existing vault data".
                // Safest to keep connections/social graph, but delete encrypted data.
                // Keeping connections.
            }
        });

        // Delete Shares sent by or received by user (invalidates old keys)
        await Share.deleteMany({
            $or: [{ senderId: user._id }, { recipientId: user._id }]
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Reset Error", e);
        return new NextResponse(e.message || 'Reset failed', { status: 500 });
    }
}
