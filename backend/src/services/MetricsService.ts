import { BodyMetrics } from "../models/BodyMetrics";

export const MetricsService = {
  upsert: (userId: string, data: { weekStartDate: Date; weight: number; height: number; bmi: number; extraFields: Record<string, string | number> }) => {
    return BodyMetrics.findOneAndUpdate(
      { userId, weekStartDate: data.weekStartDate },
      { $set: { ...data, userId } },
      { upsert: true, new: true }
    );
  },
  list: (userId: string) => BodyMetrics.find({ userId }).sort({ weekStartDate: -1 })
};
