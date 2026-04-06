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
            isPaid: Boolean
        }
    ],
    total: Number,
    isPaid: Boolean,
    foodType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodType'
    }
});

export default mongoose.models.History || mongoose.model('History', HistorySchema);