import mongoose from "mongoose";
import { env } from "./env";

export const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
};
