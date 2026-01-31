import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { decryptServerData } from '@/lib/server-crypto';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('encryptedVaultKey');

    if (!user || !user.encryptedVaultKey) {
        return new NextResponse('Key not found (Setup required)', { status: 404 });
    }

    try {
        const vaultKey = decryptServerData(user.encryptedVaultKey);
        return NextResponse.json({ vaultKey });
    } catch (error) {
        console.error("Failed to decrypt vault key", error);
        return new NextResponse('Failed to decrypt key', { status: 500 });
    }
}
