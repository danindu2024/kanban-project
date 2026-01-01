import mongoose from 'mongoose';
import env from '../utils/env';

const connectDB = async () => {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;