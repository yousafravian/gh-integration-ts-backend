import mongoose from "mongoose";

import { env } from "@/common/utils/envConfig";

// Connect to mongoose from env.DB_URL
const connectDB = async () => {
  try {
    console.info("Connecting to MongoDB");
    await mongoose.connect(env.DB_URL);
    console.info("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export { connectDB };
