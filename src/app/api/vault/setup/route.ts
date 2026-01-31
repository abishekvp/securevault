import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { encryptServerData } from '@/lib/server-crypto';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vaultKey, encryptedVaultData } = await req.json();

    if (!vaultKey) {
        return new NextResponse('Missing required fields: vaultKey', { status: 400 });
    }

    // Encrypt the Vault Key with the Server Secret
    const encryptedVaultKey = encryptServerData(vaultKey);

    await connectDB();

    await User.findOneAndUpdate(
        { email: session.user.email },
        {
            encryptionSalt: null, // No longer used
            encryptedVaultKey,
            encryptedVaultData: encryptedVaultData || null,
        }
    );

    return NextResponse.json({ success: true });
}
