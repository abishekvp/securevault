import connectDB from '@/lib/db';
import Folder from '@/models/Folder';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

        await connectDB();

        // @ts-ignore
        const folders = await Folder.find({ owner: session.user.id }).sort({ name: 1 });
        return NextResponse.json(folders);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

        const { name } = await req.json();
        if (!name) return new NextResponse('Name required', { status: 400 });

        await connectDB();

        // @ts-ignore
        const folder = await Folder.create({
            // @ts-ignore
            owner: session.user.id,
            name
        });

        return NextResponse.json(folder);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
