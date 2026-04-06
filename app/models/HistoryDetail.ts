import mongoose from 'mongoose';

const HistoryDetailSchema = new mongoose.Schema({
    history: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'History'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    total: Number,
    isPaid: Boolean
});

export default mongoose.models.HistoryDetail || mongoose.model('HistoryDetail', HistoryDetailSchema);