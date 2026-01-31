import connectDB from '@/lib/db';
import Folder from '@/models/Folder';
import Account from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

        const { name } = await req.json();

        await connectDB();

        // @ts-ignore
        const updated = await Folder.findOneAndUpdate(
            // @ts-ignore
            { _id: params.id, owner: session.user.id },
            { name },
            { new: true }
        );

        if (!updated) return new NextResponse('Not found', { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

        await connectDB();

        // Check if folder has items? 
        // Option 1: Prevent delete. Option 2: Move items to root. Option 3: Cascade delete.
        // Let's implement Option 2: Move items to root (folderId: null)

        // @ts-ignore
        const folder = await Folder.findOne({ _id: params.id, owner: session.user.id });
        if (!folder) return new NextResponse('Not found', { status: 404 });

        // Unlink items
        // @ts-ignore
        await Account.updateMany({ folderId: params.id, owner: session.user.id }, { $unset: { folderId: 1 } });

        await folder.deleteOne();

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
