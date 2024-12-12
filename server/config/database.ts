import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(Bun.env.MONGODB_URI!);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};
