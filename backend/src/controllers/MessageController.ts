import { Request, Response } from "express";
import { ContactMessage } from "../models/ContactMessage";
import { AppError } from "../utils/errors";

export const MessageController = {
  list: async (_req: Request, res: Response) => {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json({ messages });
  },

  markRead: async (req: Request, res: Response) => {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) throw new AppError("Message not found", 404, "NOT_FOUND");

    msg.isRead = true;
    await msg.save();
    res.json({ message: msg });
  },

  remove: async (req: Request, res: Response) => {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) throw new AppError("Message not found", 404, "NOT_FOUND");

    await msg.deleteOne();
    res.json({ message: "Deleted" });
  },
};
