// @ts-nocheck
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    Name: String,
    isActive: Boolean,
    qr: String
});

export default mongoose.models.User || mongoose.model('User', UserSchema);