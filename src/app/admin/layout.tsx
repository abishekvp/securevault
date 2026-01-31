import AdminSidebar from '@/components/AdminSidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import User from '@/models/User';
import connectDB from '@/lib/db';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect('/login');
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.isAdmin) {
        redirect('/vault'); // Kick non-admins back to vault
    }

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden relative">
            {/* Background Decorative Elements (Red/Security Theme) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <AdminSidebar />
            <main className="flex-1 relative z-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
