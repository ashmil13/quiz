import mongoose from 'mongoose';

// Connect to MongoDB Database
export const connectDB = async () => {
  const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (process.env.VERCEL && !dbUri) {
    console.error('❌ Critical Error: Neither MONGO_URI nor MONGODB_URI environment variable is set in Vercel settings.');
    throw new Error('Database connection URI is missing');
  }

  try {
    const conn = await mongoose.connect(dbUri || 'mongodb://localhost:27017/quiz');
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

