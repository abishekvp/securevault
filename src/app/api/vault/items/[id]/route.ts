import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Account from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        await connectDB();

        console.log(`[API] Updating item: ${params.id} for user: ${session.user.id}`);
        const item = await Account.findOne({ _id: params.id, owner: session.user.id });

        if (!item) {
            console.warn(`[API] Item not found or unauthorized: ${params.id}`);
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Logic check: Restore from trash?
        if (body.restore) {
            item.trashDate = undefined; // Unset trash
            await item.save();
            return NextResponse.json(item);
        }

        // Normal update
        Object.assign(item, body);
        await item.save();

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const permanent = searchParams.get('permanent') === 'true';

        await connectDB();
        const item = await Account.findOne({ _id: params.id, owner: session.user.id });
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        if (permanent) {
            await Account.deleteOne({ _id: params.id });
            return NextResponse.json({ message: 'Permanently deleted' });
        } else {
            item.trashDate = new Date();
            await item.save();
            return NextResponse.json({ message: 'Moved to trash' });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
