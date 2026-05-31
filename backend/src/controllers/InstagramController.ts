import { Request, Response } from "express";
import { InstagramPost } from "../models/InstagramPost";
import { uploadToR2, deleteFromR2 } from "../utils/r2Upload";
import { AppError } from "../utils/errors";
import { serverCache } from "../utils/cache";

export const InstagramController = {
  list: async (_req: Request, res: Response) => {
    const posts = await InstagramPost.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ posts });
  },

  create: async (req: Request, res: Response) => {
    let thumbnailUrl = req.body.thumbnailUrl || "";

    if (req.file) {
      thumbnailUrl = await uploadToR2(req.file, "instagram");
    }

    if (!thumbnailUrl) {
      throw new AppError("Thumbnail is required", 400, "MISSING_THUMBNAIL");
    }

    const count = await InstagramPost.countDocuments();
    const post = await InstagramPost.create({
      thumbnailUrl,
      postUrl: req.body.postUrl || "",
      caption: req.body.caption || "",
      type: req.body.type || "post",
      order: req.body.order ?? count,
      isActive: req.body.isActive !== "false",
    });

    serverCache.delete("public_instagram");
    res.status(201).json({ post });
  },

  update: async (req: Request, res: Response) => {
    const post = await InstagramPost.findById(req.params.id);
    if (!post) throw new AppError("Post not found", 404, "NOT_FOUND");

    if (req.file) {
      if (post.thumbnailUrl) await deleteFromR2(post.thumbnailUrl);
      post.thumbnailUrl = await uploadToR2(req.file, "instagram");
    } else if (req.body.thumbnailUrl) {
      post.thumbnailUrl = req.body.thumbnailUrl;
    }

    if (req.body.postUrl !== undefined) post.postUrl = req.body.postUrl;
    if (req.body.caption !== undefined) post.caption = req.body.caption;
    if (req.body.type !== undefined) post.type = req.body.type;
    if (req.body.order !== undefined) post.order = Number(req.body.order);
    if (req.body.isActive !== undefined) post.isActive = req.body.isActive === "true" || req.body.isActive === true;

    await post.save();
    serverCache.delete("public_instagram");
    res.json({ post });
  },

  remove: async (req: Request, res: Response) => {
    const post = await InstagramPost.findById(req.params.id);
    if (!post) throw new AppError("Post not found", 404, "NOT_FOUND");

    if (post.thumbnailUrl) await deleteFromR2(post.thumbnailUrl);
    await post.deleteOne();
    serverCache.delete("public_instagram");
    res.json({ message: "Deleted" });
  },
};
