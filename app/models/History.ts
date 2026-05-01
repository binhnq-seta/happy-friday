import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
    date: Date,
    paidUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    participants: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            amount: Number,
            isPaid: Boolean,
            ownerConfirm: Boolean
        }
    ],
    total: Number,
    isPaid: Boolean,
    foodType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodType'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdOn: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedOn: { type: Date, default: Date.now },
});

export default mongoose.models.History || mongoose.model('History', HistorySchema);