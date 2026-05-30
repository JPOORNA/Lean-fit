import mongoose, { Schema, Document } from "mongoose";

export type GroupSessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface GroupSessionSlotDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  pricePaise: number;
  maxPeople: number;
  bookedUserIds: mongoose.Types.ObjectId[];
  status: GroupSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const groupSessionSlotSchema = new Schema<GroupSessionSlotDocument>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    pricePaise: { type: Number, required: true, min: 0 },
    maxPeople: { type: Number, required: true, min: 1 },
    bookedUserIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    status: { type: String, enum: ["scheduled", "in_progress", "completed", "cancelled"], default: "scheduled" }
  },
  { timestamps: true }
);

groupSessionSlotSchema.index({ doctorId: 1, startTime: 1, endTime: 1 }, { unique: true });

groupSessionSlotSchema.index({ doctorId: 1, startTime: 1 });

groupSessionSlotSchema.index({ bookedUserIds: 1, startTime: 1 });

export const GroupSessionSlot = mongoose.model<GroupSessionSlotDocument>("GroupSessionSlot", groupSessionSlotSchema);
