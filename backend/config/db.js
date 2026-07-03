import mongoose from 'mongoose';

// Connect to MongoDB Database
export const connectDB = async () => {
  if (process.env.VERCEL && !process.env.MONGO_URI) {
    console.error('❌ Critical Error: MONGO_URI environment variable is missing in Vercel settings.');
    throw new Error('MONGO_URI is missing');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quiz');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

