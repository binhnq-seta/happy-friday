import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/database/mongodb';
import HistoryDetail from '@/app/models/HistoryDetail';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    try {
        const updatedDetail = await HistoryDetail.findByIdAndUpdate(id, body, { returnDocument: 'after' });
        if (!updatedDetail) {
            return NextResponse.json({ error: 'HistoryDetail not found' }, { status: 404 });
        }
        return NextResponse.json(updatedDetail);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}