import { Request, Response } from "express";
import { InstagramPost } from "../models/InstagramPost";
import { Testimonial } from "../models/Testimonial";
import { Service } from "../models/Service";
import { ContactMessage } from "../models/ContactMessage";
import { AppError } from "../utils/errors";
import { serverCache } from "../utils/cache";

const CACHE_TTL = 6 * 60 * 60 * 1000;

export const PublicSiteController = {
  listInstagramPosts: async (_req: Request, res: Response) => {
    const cacheKey = "public_instagram";
    const cached = serverCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const posts = await InstagramPost.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    const data = { posts };
    serverCache.set(cacheKey, data, CACHE_TTL);
    res.json(data);
  },

  listTestimonials: async (_req: Request, res: Response) => {
    const cacheKey = "public_testimonials";
    const cached = serverCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    const data = { testimonials };
    serverCache.set(cacheKey, data, CACHE_TTL);
    res.json(data);
  },

  listServices: async (_req: Request, res: Response) => {
    const cacheKey = "public_services";
    const cached = serverCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const services = await Service.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    const data = { services };
    serverCache.set(cacheKey, data, CACHE_TTL);
    res.json(data);
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
