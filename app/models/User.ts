// @ts-nocheck
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    Name: String,
    email: { type: String, unique: true, required: true }, 
    password: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    qr: String,
    image: String,
    provider: { type: String, default: 'credentials' },
    googleId: { type: String, unique: true, sparse: true } 
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);