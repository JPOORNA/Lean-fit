import { Request, Response } from "express";
import { InstagramPost } from "../models/InstagramPost";
import { Testimonial } from "../models/Testimonial";
import { Service } from "../models/Service";
import { ContactMessage } from "../models/ContactMessage";
import { AppError } from "../utils/errors";

export const PublicSiteController = {
  listInstagramPosts: async (_req: Request, res: Response) => {
    const posts = await InstagramPost.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ posts });
  },

  listTestimonials: async (_req: Request, res: Response) => {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ testimonials });
  },

  listServices: async (_req: Request, res: Response) => {
    const services = await Service.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ services });
  },

  submitContact: async (req: Request, res: Response) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      throw new AppError("All required fields must be provided", 400, "MISSING_FIELDS");
    }

    const contact = await ContactMessage.create({
      name,
      email,
      phone: phone || "",
      subject,
      message,
    });

    res.status(201).json({ message: "Message sent successfully", id: contact._id });
  },
};
