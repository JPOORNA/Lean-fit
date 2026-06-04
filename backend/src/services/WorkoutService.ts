import { WorkoutLog } from "../models/WorkoutLog";

export const WorkoutService = {
  upsert: (userId: string, data: { date: Date; attended: boolean; notes?: string }) => {
    return WorkoutLog.findOneAndUpdate(
      { userId, date: data.date },
      { $set: { ...data, userId } },
      { upsert: true, new: true }
    );
  },
  list: (userId: string) => WorkoutLog.find({ userId }).sort({ date: -1 })
};
