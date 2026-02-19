import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI manquant");
}

export const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connecté");
};