import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/app/database/mongodb';
import History from '@/app/models/History';
import User from '@/app/models/User';
import FoodType from '@/app/models/FoodType';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id } = params;

        const body = await request.json();
        const { date, foodType, payer, total, participants, amounts, auditUserId } = body;

        // Validate required fields
        if (!date || !foodType || !payer || !total) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find payer user by ID or name
        let payerUser = null;
        let payerName = null;
        
        if (typeof payer === 'object' && payer._id) {
            payerUser = await User.findById(payer._id);
            payerName = payer.Name;
        } else if (typeof payer === 'string' && payer.trim()) {
            // Check if it's a MongoDB ObjectId
            if (payer.match(/^[0-9a-fA-F]{24}$/)) {
                payerUser = await User.findById(payer);
                if (!payerUser) {
                    return NextResponse.json(
                        { error: 'Payer user not found' },
                        { status: 404 }
                    );
                }
                payerName = payerUser.Name;
            } else {
                // Treat as name
                payerUser = await User.findOne({ Name: payer });
                payerName = payer;
                
                // Create if not found
                if (!payerUser && payerName) {
                    payerUser = await User.create({ Name: payerName, isActive: true });
                }
            }
        }

        if (!payerUser) {
            return NextResponse.json(
                { error: 'Payer user not found or is empty' },
                { status: 404 }
            );
        }

        // Validate and process food type
        if (!foodType) {
            return NextResponse.json(
                { error: 'Food type is required' },
                { status: 400 }
            );
        }

        let foodTypeDoc = null;
        
        // Check if foodType is an ID (ObjectId format)
        if (typeof foodType === 'string' && foodType.match(/^[0-9a-fA-F]{24}$/)) {
            foodTypeDoc = await FoodType.findById(foodType);
        } else if (typeof foodType === 'string') {
            // foodType is a name, try to find it
            foodTypeDoc = await FoodType.findOne({ name: foodType });
            
            // Create if not found
            if (!foodTypeDoc) {
                foodTypeDoc = await FoodType.create({ name: foodType, isActive: true });
            }
        }

        if (!foodTypeDoc) {
            return NextResponse.json(
                { error: 'Food type not found and could not be created' },
                { status: 400 }
            );
        }
        // Process participants
        const participantsList = [];
        if (Array.isArray(participants) && participants.length > 0) {
            for (const participant of participants) {
                let participantUser = null;
                let participantName = null;

                // Check if participant is an object with _id (from frontend)
                if (typeof participant === 'object' && participant._id) {
                    participantUser = await User.findById(participant._id);
                    participantName = participant.Name;
                } else if (typeof participant === 'string') {
                    // participant is a name string
                    participantUser = await User.findOne({ Name: participant });
                    participantName = participant;
                } else if (typeof participant === 'object' && (participant.Name || participant.name)) {
                    // participant is an object with Name or name property (both cases)
                    const pName = participant.Name || participant.name;
                    participantUser = await User.findOne({ Name: pName });
                    participantName = pName;
                }

                // Create participant if not found
                if (!participantUser && participantName) {
                    participantUser = await User.create({ Name: participantName, isActive: true });
                }

                if (participantUser) {
                    // Get the amount - prefer participant.amount if provided (object), else use amounts map
                    let amount = 0;
                    if (typeof participant === 'object' && (participant.amount || participant.amount === 0)) {
                        amount = Number(participant.amount || 0);
                    } else if (amounts) {
                        if (participantName) {
                            amount = amounts[participantName] || 0;
                        } else if (typeof participant === 'string') {
                            amount = amounts[participant] || 0;
                        }
                    }

                    // Preserve isPaid/ownerConfirm if provided in participant object, otherwise default to false
                    const isPaidFlag = typeof participant === 'object' && 'isPaid' in participant ? Boolean(participant.isPaid) : false;
                    const ownerConfirmFlag = typeof participant === 'object' && 'ownerConfirm' in participant ? Boolean(participant.ownerConfirm) : false;

                    participantsList.push({
                        user: participantUser._id,
                        amount: amount,
                        isPaid: isPaidFlag,
                        ownerConfirm: ownerConfirmFlag
                    });
                }
            }
        }

        // Update history record
        const updatedHistory = await History.findByIdAndUpdate(
            id,
            {
                date: new Date(date),
                paidUser: payerUser._id,
                foodType: foodTypeDoc._id,
                total: Number(total),
                participants: participantsList,
                // Only mark the history as paid when every participant has both paid and been owner-confirmed
                isPaid: participantsList.length > 0 && participantsList.every((p: any) => Boolean(p.isPaid) && Boolean(p.ownerConfirm)),
                updatedBy: auditUserId || payerUser._id,
                updatedOn: new Date()
            },
            { returnDocument: 'after' }
        )
        .populate('paidUser')
        .populate('foodType')
        .populate('participants.user');

        if (!updatedHistory) {
            return NextResponse.json(
                { error: 'History not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: updatedHistory },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating history:', error);
        return NextResponse.json(
            { error: 'Failed to update history', message: String(error) },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { participantUserId, isPaid, ownerConfirm, auditUserId } = body;

    if (!participantUserId) {
        return NextResponse.json(
            { error: 'participantUserId is required' },
            { status: 400 }
        );
    }

    try {
        const historyDoc = await History.findById(id);

        if (!historyDoc) {
            return NextResponse.json(
                { error: 'History not found' },
                { status: 404 }
            );
        }

        const participant = historyDoc.participants.find((p: any) =>
            p.user?.toString() === participantUserId
        );

        if (!participant) {
            return NextResponse.json(
                { error: 'Participant not found' },
                { status: 404 }
            );
        }

        if (typeof isPaid === 'boolean') {
            participant.isPaid = isPaid;
        }

        if (typeof ownerConfirm === 'boolean') {
            participant.ownerConfirm = ownerConfirm;
        }

        // Only mark history as paid when every participant has both paid and ownerConfirmed
        historyDoc.isPaid = historyDoc.participants.every((p: any) => Boolean(p.isPaid) && Boolean(p.ownerConfirm));
        historyDoc.updatedBy = auditUserId || historyDoc.updatedBy;
        historyDoc.updatedOn = new Date();

        const updatedHistory = await historyDoc.save();
        const populatedHistory = await History.findById(updatedHistory._id)
            .populate('participants.user')
            .populate('paidUser')
            .populate('foodType');

        return NextResponse.json(populatedHistory || updatedHistory);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to update' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id } = params;

        const deletedHistory = await History.findByIdAndDelete(id);

        if (!deletedHistory) {
            return NextResponse.json(
                { error: 'History not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'History deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting history:', error);
        return NextResponse.json(
            { error: 'Failed to delete history', message: String(error) },
            { status: 500 }
        );
    }
}
