import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

// POST: Upload Generated Keys (Public + Encrypted Private)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { publicKey, encryptedPrivateKey } = await req.json();

        // Validation: Ensure valid base64 strings if strict
        if (!publicKey || !encryptedPrivateKey) {
            return NextResponse.json({ error: 'Missing keys' }, { status: 400 });
        }

        await connectDB();

        // Update User with keys
        await User.updateOne({ email: session.user.email }, {
            publicKey,
            encryptedPrivateKey
        });

        return NextResponse.json({ message: 'Keys saved successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
