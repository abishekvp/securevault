import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    // Verify Admin (basic check, ideally middleware)
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) return new NextResponse('Forbidden', { status: 403 });

    const { getSetting } = await import('@/lib/settings');
    const allowSignups = await getSetting<boolean>('site.allow_signups');
    const maintenanceMode = await getSetting<boolean>('site.maintenance_mode');

    return NextResponse.json({
        productConfig: { allowSignups, maintenanceMode }
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) return new NextResponse('Forbidden', { status: 403 });

    try {
        const { allowSignups, maintenanceMode } = await req.json();
        const { setSetting } = await import('@/lib/settings');

        if (allowSignups !== undefined) await setSetting('site.allow_signups', allowSignups);
        if (maintenanceMode !== undefined) await setSetting('site.maintenance_mode', maintenanceMode);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Product Config Save Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
