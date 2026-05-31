import { Request, Response } from "express";
import { Service } from "../models/Service";
import { uploadToR2 } from "../utils/r2Upload";
import { AppError } from "../utils/errors";
import { serverCache } from "../utils/cache";

export const ServiceController = {
  listAll: async (_req: Request, res: Response) => {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.json({ services });
  },

  create: async (req: Request, res: Response) => {
    let imageUrl = req.body.imageUrl;

    if (req.file) {
      imageUrl = await uploadToR2(req.file, "services");
    }

    if (!imageUrl) {
      throw new AppError("Image is required", 400, "MISSING_IMAGE");
    }

    const { title, description, benefits, iconName, color, order, isActive } = req.body;

    const service = await Service.create({
      title,
      description,
      imageUrl,
      benefits: Array.isArray(benefits) ? benefits : JSON.parse(benefits || "[]"),
      iconName,
      color,
      order: Number(order) || 0,
      isActive: isActive === "true" || isActive === true
    });

    serverCache.delete("public_services");
    res.status(201).json({ service });
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (req.file) {
      updateData.imageUrl = await uploadToR2(req.file, "services");
    }

    if (updateData.benefits && typeof updateData.benefits === "string") {
      updateData.benefits = JSON.parse(updateData.benefits);
    }

    if (updateData.order !== undefined) updateData.order = Number(updateData.order);
    if (updateData.isActive !== undefined) updateData.isActive = updateData.isActive === "true" || updateData.isActive === true;

    const service = await Service.findByIdAndUpdate(id, updateData, { new: true });
    if (!service) {
      throw new AppError("Service not found", 404, "NOT_FOUND");
    }

    serverCache.delete("public_services");
    res.json({ service });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      throw new AppError("Service not found", 404, "NOT_FOUND");
    }
    serverCache.delete("public_services");
    res.json({ message: "Service deleted successfully" });
  }
};
