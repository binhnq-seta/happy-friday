import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://admin:admin@atlascluster.7etf9.mongodb.net/';

export async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
    }
}