// @ts-nocheck
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    Name: String,
    email: { type: String, unique: true, required: true }, 
    password: { type: String, required: true },
    isActive: Boolean,
    qr: String
});

export default mongoose.models.User || mongoose.model('User', UserSchema);