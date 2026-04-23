import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { connectDB } from '@/app/database/mongodb';
import User from '@/app/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { email, name, newPassword } = await req.json();
        await connectDB();

        // 1. If the user is changing their email, check if the NEW email is already in use
        if (email !== session.user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return NextResponse.json({ message: "This email is already linked to another account" }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (name) updateData.Name = name;
        if (email) updateData.email = email;
        
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: updateData }
        );

        return NextResponse.json({ message: "Success" });
    } catch (error) {
        return NextResponse.json({ message: "Internal error" }, { status: 500 });
    }
}