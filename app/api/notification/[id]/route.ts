import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/app/database/mongodb';
import Notification from '@/app/models/Notification';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();
        const { isRead } = body;

        if (typeof isRead !== 'boolean') {
            return NextResponse.json(
                { error: 'isRead must be a boolean' },
                { status: 400 }
            );
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            { isRead, updatedOn: new Date() },
            { returnDocument: 'after' }
        ).populate('createdBy', 'Name email');

        if (!updatedNotification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedNotification, { status: 200 });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification', message: String(error) },
            { status: 500 }
        );
    }
}
