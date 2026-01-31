import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Account from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId');
        const trash = searchParams.get('trash') === 'true';

        await connectDB();
        const query: any = { owner: session.user.id };

        if (trash) {
            query.trashDate = { $ne: null };
        } else {
            query.trashDate = null;
        }

        if (folderId) query.folderId = folderId;

        const items = await Account.find(query).sort({ createdAt: -1 });
        return NextResponse.json(items);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        // Body should contain: encryptedData, encryptedItemKey, type, folderId, etc.

        await connectDB();
        const newItem = await Account.create({
            ...body,
            owner: session.user.id
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
