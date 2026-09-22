import mongoose from "mongoose";
import { env } from "./env";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI);
  isConnected = true;

  console.log(`[db] connected to MongoDB (${env.NODE_ENV})`);

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("[db] disconnected");
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}
