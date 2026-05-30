import { Request, Response } from "express";
import { Testimonial } from "../models/Testimonial";
import { uploadToR2, deleteFromR2 } from "../utils/r2Upload";
import { AppError } from "../utils/errors";

export const TestimonialController = {
  list: async (_req: Request, res: Response) => {
    const testimonials = await Testimonial.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ testimonials });
  },

  create: async (req: Request, res: Response) => {
    let beforeImageUrl = req.body.beforeImageUrl || "";
    let afterImageUrl = req.body.afterImageUrl || "";

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.beforeImage?.[0]) {
      beforeImageUrl = await uploadToR2(files.beforeImage[0], "testimonials");
    }
    if (files?.afterImage?.[0]) {
      afterImageUrl = await uploadToR2(files.afterImage[0], "testimonials");
    }

    const count = await Testimonial.countDocuments();
    const testimonial = await Testimonial.create({
      clientName: req.body.clientName,
      beforeImageUrl,
      afterImageUrl,
      quote: req.body.quote,
      weightLost: req.body.weightLost || "",
      duration: req.body.duration || "",
      rating: Number(req.body.rating) || 5,
      isActive: req.body.isActive !== "false",
      order: req.body.order ?? count,
    });

    res.status(201).json({ testimonial });
  },

  update: async (req: Request, res: Response) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) throw new AppError("Testimonial not found", 404, "NOT_FOUND");

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.beforeImage?.[0]) {
      if (testimonial.beforeImageUrl) await deleteFromR2(testimonial.beforeImageUrl);
      testimonial.beforeImageUrl = await uploadToR2(files.beforeImage[0], "testimonials");
    } else if (req.body.beforeImageUrl !== undefined) {
      testimonial.beforeImageUrl = req.body.beforeImageUrl;
    }

    if (files?.afterImage?.[0]) {
      if (testimonial.afterImageUrl) await deleteFromR2(testimonial.afterImageUrl);
      testimonial.afterImageUrl = await uploadToR2(files.afterImage[0], "testimonials");
    } else if (req.body.afterImageUrl !== undefined) {
      testimonial.afterImageUrl = req.body.afterImageUrl;
    }

    if (req.body.clientName !== undefined) testimonial.clientName = req.body.clientName;
    if (req.body.quote !== undefined) testimonial.quote = req.body.quote;
    if (req.body.weightLost !== undefined) testimonial.weightLost = req.body.weightLost;
    if (req.body.duration !== undefined) testimonial.duration = req.body.duration;
    if (req.body.rating !== undefined) testimonial.rating = Number(req.body.rating);
    if (req.body.order !== undefined) testimonial.order = Number(req.body.order);
    if (req.body.isActive !== undefined) testimonial.isActive = req.body.isActive === "true" || req.body.isActive === true;

    await testimonial.save();
    res.json({ testimonial });
  },

  remove: async (req: Request, res: Response) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) throw new AppError("Testimonial not found", 404, "NOT_FOUND");

    if (testimonial.beforeImageUrl) await deleteFromR2(testimonial.beforeImageUrl);
    if (testimonial.afterImageUrl) await deleteFromR2(testimonial.afterImageUrl);
    await testimonial.deleteOne();

    res.json({ message: "Deleted" });
  },
};
