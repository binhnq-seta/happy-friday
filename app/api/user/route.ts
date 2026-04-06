import { NextResponse } from 'next/server';
import { connectDB } from '@/app/database/mongodb';
import User from '@/app/models/User';

export async function GET() {
    await connectDB();
    const users = await User.find();
    return NextResponse.json(users);
}