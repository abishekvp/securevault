import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { email, otp, type } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
        }

        await connectDB();
        // Select hidden fields
        const user = await User.findOne({ email }).select('+otpCode +otpExpires');

        if (!user) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (!user.otpCode || !user.otpExpires || new Date() > user.otpExpires) {
            return NextResponse.json({ error: 'Expired or Invalid OTP' }, { status: 400 });
        }

        if (user.otpCode !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // OTP is valid. Action depends on type.
        const updateData: any = {
            $unset: { otpCode: 1, otpExpires: 1 }
        };

        if (type === 'verify') {
            updateData.isEmailVerified = true;
        }

        await User.findByIdAndUpdate(user._id, updateData);

        return NextResponse.json({ message: 'OTP Verified successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
