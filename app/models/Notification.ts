// @ts-nocheck
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    title: String,
    detail: String,
    notiTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdOn: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedOn: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);