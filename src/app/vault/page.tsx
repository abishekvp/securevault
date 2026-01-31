import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import User from '@/models/User';
import VaultView from '@/components/VaultView';

export default async function VaultPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    await connectDB();

    // Fetch user encryption metadata only
    const user = await User.findOne({ email: session.user?.email }).select(
        'encryptionSalt encryptedVaultKey encryptedVaultData isAdmin'
    ).lean();

    if (!user) {
        // Should theoretically not happen if session exists
        redirect('/api/auth/signin');
    }

    // Convert MongoDB ObjectIds/Dates to plain strings/numbers if needed, 
    // though we selected simple fields. .lean() helps.
    const userData = {
        encryptionSalt: user.encryptionSalt || null,
        encryptedVaultKey: user.encryptedVaultKey || null,
        encryptedVaultData: user.encryptedVaultData || null,
        isAdmin: user.isAdmin || false,
    };

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[hsl(var(--primary))]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative z-10 h-full">
                <VaultView
                    userData={userData}
                    userEmail={session.user?.email || ''}
                />
            </div>
        </div>
    );
}
