import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flbops';
// Connect to database (MongoDB)
const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected to : ', MONGO_URI);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};


export default connectDB;