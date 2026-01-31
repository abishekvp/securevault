import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET: Seed default admin (legacy/initial setup)
export async function GET() {
    try {
        await connectDB();

        const adminEmail = 'admin'; // Legacy default
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            return NextResponse.json({ message: 'Default admin user already exists' }, { status: 200 });
        }

        const hashedPassword = await bcrypt.hash('admin', 10);

        const newAdmin = await User.create({
            email: adminEmail,
            name: 'System Administrator',
            passwordHash: hashedPassword,
            isAdmin: true,
            isEmailVerified: true,
            provider: 'credentials',
        });

        return NextResponse.json({ message: 'Default admin created', userId: newAdmin._id }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Promote user or create new admin
export async function POST(req: Request) {
    try {
        const { email, password, action } = await req.json(); // action: 'create' | 'promote'

        await connectDB();

        if (action === 'promote') {
            // Promote existing user by email
            if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
            const user = await User.findOneAndUpdate({ email }, { isAdmin: true }, { new: true });
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            return NextResponse.json({ message: `User ${email} promoted to admin`, user });
        } else {
            // Create new admin
            if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

            const existingUser = await User.findOne({ email });
            if (existingUser) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

            const hashedPassword = await bcrypt.hash(password, 10);
            const newAdmin = await User.create({
                email,
                name: 'Admin User',
                passwordHash: hashedPassword,
                isAdmin: true,
                isEmailVerified: true,
                provider: 'credentials',
            });
            return NextResponse.json({ message: 'Admin created', userId: newAdmin._id }, { status: 201 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
