import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { name, username, privacySettings } = await req.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse('User not found', { status: 404 });

    try {
        const update: any = {};
        if (name !== undefined) update.name = name;
        if (username !== undefined) {
            const existing = await User.findOne({ username, email: { $ne: session.user.email } });
            if (existing) return new NextResponse('Username taken', { status: 409 });
            update.username = username;
        }

        if (privacySettings) {
            // Use dot notation to avoid overwriting the entire object if other fields exist
            if (privacySettings.autoAcceptConnections !== undefined) {
                update['privacySettings.autoAcceptConnections'] = privacySettings.autoAcceptConnections;
            }
            if (privacySettings.autoJoinGroups !== undefined) {
                update['privacySettings.autoJoinGroups'] = privacySettings.autoJoinGroups;
            }
            if (privacySettings.autoJoinWhitelist !== undefined) {
                update['privacySettings.autoJoinWhitelist'] = privacySettings.autoJoinWhitelist;
            }
        }

        console.log("Updating User Profile:", session.user.email, update);

        const result = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: update },
            { new: true, runValidators: true }
        );

        console.log("User Profile Update Result:", result ? "Found and Updated" : "NOT FOUND");

        return NextResponse.json({ success: true, user: result });
    } catch (error: any) {
        console.error("Profile Update Error:", error);
        return new NextResponse(`Update failed: ${error.message}`, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('name username email privacySettings isAdmin');
    if (!user) return new NextResponse('User not found', { status: 404 });

    console.log("GET Profile - Privacy:", user.privacySettings);

    return NextResponse.json({ user });
}
