import { User, UserDocument } from "../models/User";

export const UserRepository = {
  findByEmail: (email: string) => User.findOne({ email }),
  findById: (id: string) => User.findById(id),
  create: (data: Partial<UserDocument>) => User.create(data),
  countDoctors: () => User.countDocuments({ role: "doctor" }),
  listDoctors: () => User.find({ role: "doctor" }).select("name email")
};
