import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { questions } = await req.json(); // Expect array of { question, answer }

        if (!Array.isArray(questions) || questions.length < 2) {
            return NextResponse.json({ error: 'At least 2 questions required' }, { status: 400 });
        }

        const hashedQuestions = await Promise.all(questions.map(async (q: any) => ({
            question: q.question,
            answerHash: await bcrypt.hash(q.answer.toLowerCase().trim(), 10)
        })));

        await connectDB();
        await User.findOneAndUpdate(
            { email: session.user.email },
            { securityQuestions: hashedQuestions }
        );

        return NextResponse.json({ message: 'Security questions saved' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
