import { NextResponse } from 'next/server';
import { connectDB } from '@/app/database/mongodb';
import HistoryDetail from '@/app/models/HistoryDetail';
import '@/app/models/User';

export async function GET() {
    await connectDB();
    const historyDetails = await HistoryDetail.find()
    .populate('user')
    ;
    return NextResponse.json(historyDetails);
}