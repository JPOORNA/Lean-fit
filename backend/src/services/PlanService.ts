import { DietPlan } from "../models/DietPlan";
import { WorkoutPlan } from "../models/WorkoutPlan";

export const PlanService = {
  assignDietPlan: async (doctorId: string, userId: string, data: { name?: string; description?: string; fileUrl: string; startDate?: Date; endDate?: Date }) => {
    const activeCount = await DietPlan.countDocuments({ assignedTo: userId, isActive: true });
    if (activeCount >= 3) {
      throw new Error("Maximum of 3 active diet plans allowed. Please delete an existing plan first.");
    }
    return DietPlan.create({ doctorId, ...data, isActive: true, assignedTo: userId });
  },
  listDietPlansForUser: (userId: string) => DietPlan.find({ assignedTo: userId, isActive: true }),
  updateDietPlan: (planId: string, data: { name?: string; description?: string; fileUrl?: string; startDate?: Date; endDate?: Date }) => {
    return DietPlan.findByIdAndUpdate(planId, data, { new: true });
  },
  deleteDietPlan: (planId: string) => {
    return DietPlan.findByIdAndDelete(planId);
  },

  assignWorkoutPlan: async (doctorId: string, userId: string, data: { name?: string; description?: string; fileUrl: string; startDate?: Date; endDate?: Date }) => {
    const activeCount = await WorkoutPlan.countDocuments({ assignedTo: userId, isActive: true });
    if (activeCount >= 3) {
      throw new Error("Maximum of 3 active workout plans allowed. Please delete an existing plan first.");
    }
    return WorkoutPlan.create({ doctorId, ...data, isActive: true, assignedTo: userId });
  },
  listWorkoutPlansForUser: (userId: string) => WorkoutPlan.find({ assignedTo: userId, isActive: true }),
  updateWorkoutPlan: (planId: string, data: { name?: string; description?: string; fileUrl?: string; startDate?: Date; endDate?: Date }) => {
    return WorkoutPlan.findByIdAndUpdate(planId, data, { new: true });
  },
  deleteWorkoutPlan: (planId: string) => {
    return WorkoutPlan.findByIdAndDelete(planId);
  }
};
