import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/app/database/mongodb';
import Notification from '@/app/models/Notification';

export async function GET(request: Request) {
    try {
        await connectDB();
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const notifications = await Notification.find({ notiTo: userId })
            .populate('createdBy', 'Name email')
            .sort({ createdOn: -1 });

        return NextResponse.json(notifications, { status: 200 });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications', message: String(error) },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { title, detail, notiTo, createdBy } = body;

        if (!title || !notiTo || !createdBy) {
            return NextResponse.json(
                { error: 'Missing required fields: title, notiTo, createdBy' },
                { status: 400 }
            );
        }

        // Check if a notification to this user was sent within the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentNotification = await Notification.findOne({
            notiTo: notiTo,
            createdBy: createdBy,
            updatedOn: { $gte: fifteenMinutesAgo }
        });

        if (recentNotification) {
            const timeRemaining = Math.ceil(
                (recentNotification.updatedOn.getTime() + 15 * 60 * 1000 - Date.now()) / 1000
            );
            return NextResponse.json(
                { 
                    error: 'Rate limit exceeded',
                    message: `Vui lòng chờ ${timeRemaining} giây trước khi gửi thông báo tiếp theo cho người này.`,
                    retryAfter: timeRemaining
                },
                { status: 429 }
            );
        }

        const notification = new Notification({
            title,
            detail,
            notiTo,
            createdBy,
            createdOn: new Date(),
            updatedBy: createdBy,
            updatedOn: new Date(),
            isRead: false
        });

        const savedNotification = await notification.save();
        const populatedNotification = await Notification.findById(savedNotification._id)
            .populate('createdBy', 'Name email')
            .populate('notiTo', 'Name email');

        return NextResponse.json(populatedNotification, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification', message: String(error) },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        await connectDB();
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const result = await Notification.deleteMany({ notiTo: userId });

        return NextResponse.json(
            { success: true, deletedCount: result.deletedCount || 0 },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json(
            { error: 'Failed to delete notifications', message: String(error) },
            { status: 500 }
        );
    }
}
