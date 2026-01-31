import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import connectDB from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const maintenanceMode = await getSetting<boolean>('site.maintenance_mode');
        return NextResponse.json({ maintenanceMode });
    } catch (error) {
        console.error('Failed to fetch system status:', error);
        return NextResponse.json({ maintenanceMode: false }, { status: 500 });
    }
}
