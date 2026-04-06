import { NextResponse } from 'next/server';
import { connectDB } from '@/app/database/mongodb';
import FoodType from '@/app/models/FoodType';

export async function GET() {
    await connectDB();
    const foodTypes = await FoodType.find();
    return NextResponse.json(foodTypes);
}