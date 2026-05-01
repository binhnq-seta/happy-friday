import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { connectDB } from '@/app/database/mongodb';
import User from '@/app/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
            const userId = (session.user as any)?.id;
            let user: any = null;
            if (userId) {
                user = await User.findById(userId).select('email Name acqId accountName accountNo').lean();
            }
            if (!user) {
                user = await User.findOne({ email: (session.user.email || '').toLowerCase() })
                    .select('email Name acqId accountName accountNo')
                    .lean();
            }

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            email: user?.email || '',
            name: user?.Name || '',
            acqId: user?.acqId || '',
            accountName: user?.accountName || '',
            accountNo: user?.accountNo || '',
        });
    } catch (error) {
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { email, name, newPassword, acqId, accountName, accountNo } = await req.json();
        await connectDB();

        // 1. If the user is changing their email, check if the NEW email is already in use
        if (email !== session.user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return NextResponse.json({ message: "This email is already linked to another account" }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.Name = name;
        if (email !== undefined) updateData.email = email;
        if (acqId !== undefined) updateData.acqId = acqId;
        if (accountName !== undefined) updateData.accountName = accountName;
        if (accountNo !== undefined) updateData.accountNo = accountNo;

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        const userId = (session.user as any)?.id;
        const updatedUser = await User.findOneAndUpdate(
            userId ? { _id: userId } : { email: session.user.email },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: "Success" });
    } catch (error) {
        return NextResponse.json({ message: "Internal error" }, { status: 500 });
    }
}