import { DietPlan } from "../models/DietPlan";
import { WorkoutPlan } from "../models/WorkoutPlan";

export const PlanService = {
  assignDietPlan: (doctorId: string, userId: string, data: { name?: string; description?: string; fileUrl: string; startDate?: Date; endDate?: Date }) => {
    return DietPlan.updateMany({ assignedTo: userId, isActive: true }, { isActive: false })
      .then(() => DietPlan.create({ doctorId, ...data, isActive: true, assignedTo: userId }));
  },
  listDietPlansForUser: (userId: string) => DietPlan.find({ assignedTo: userId, isActive: true }),

  assignWorkoutPlan: (doctorId: string, userId: string, data: { name?: string; description?: string; fileUrl: string; startDate?: Date; endDate?: Date }) => {
    return WorkoutPlan.updateMany({ assignedTo: userId, isActive: true }, { isActive: false })
      .then(() => WorkoutPlan.create({ doctorId, ...data, isActive: true, assignedTo: userId }));
  },
  listWorkoutPlansForUser: (userId: string) => WorkoutPlan.find({ assignedTo: userId, isActive: true })
};
