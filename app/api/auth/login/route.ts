import { NextResponse } from 'next/server';
import { connectDB } from '@/app/database/mongodb';
import User from '@/app/models/User';
import { cookies } from 'next/headers'; // Import cookies

export async function POST(request: Request) {
    try {
        await connectDB();
        const { email, password } = await request.json();
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.password !== password) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set('session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 2,
            path: '/',
        });

        return NextResponse.json({ 
            message: 'Login successful', 
            user: { name: user.Name, email: user.email } 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}