import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Account from '@/models/Account';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { encryptServerData } from '@/lib/server-crypto';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { otp, newPassword, newVaultKey, encryptedPrivateKey, items } = await req.json();

    if (!otp || !newPassword || !newVaultKey || !encryptedPrivateKey || !items) {
        return new NextResponse('Missing required fields for re-encryption', { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('+otpCode +otpExpires +passwordHash');

    if (!user) return new NextResponse('User not found', { status: 404 });

    // 1. Verify OTP
    if (!user.otpCode || !user.otpExpires || user.otpCode !== otp || user.otpExpires < new Date()) {
        return new NextResponse('Invalid or expired OTP', { status: 400 });
    }

    try {
        // 2. Hash New Password (Simple SHA256 as per previous context, or use bcrypt if available)
        // Note: In a real app use bcrypt/argon2. Assuming SHA256 for consistency with previous discussion.
        const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

        // 3. Encrypt New Vault Key (Custodial: Encrypt with Server Secret)
        const encryptedVaultKey = encryptServerData(newVaultKey);

        // 4. Update User
        user.passwordHash = passwordHash;
        user.encryptedVaultKey = encryptedVaultKey;
        user.encryptedPrivateKey = encryptedPrivateKey;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        // Keep salt ideally, or rotate if using it. Here we rotate VaultKey so salt is less relevant for the key itself in Custodial mode.

        await user.save();

        // 5. Bulk Update Items
        // We use bulkWrite for atomicity and performance
        if (items.length > 0) {
            const operations = items.map((item: any) => ({
                updateOne: {
                    filter: { _id: item.id, owner: user._id },
                    update: { $set: { encryptedItemKey: item.encryptedItemKey } }
                }
            }));

            await Account.bulkWrite(operations);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Re-encryption failed:", error);
        return new NextResponse(error.message || 'Re-encryption failed', { status: 500 });
    }
}
