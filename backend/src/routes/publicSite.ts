import { Router } from "express";
import { PublicSiteController } from "../controllers/PublicSiteController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /public/instagram:
 *   get:
 *     tags: [Public]
 *     summary: List public instagram posts
 *     responses:
 *       200:
 *         description: Public instagram posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstagramPostListResponse'
 */
router.get("/instagram", asyncHandler(PublicSiteController.listInstagramPosts));

/**
 * @openapi
 * /public/testimonials:
 *   get:
 *     tags: [Public]
 *     summary: List public testimonials
 *     responses:
 *       200:
 *         description: Public testimonials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestimonialListResponse'
 */
router.get("/testimonials", asyncHandler(PublicSiteController.listTestimonials));

/**
 * @openapi
 * /public/services:
 *   get:
 *     tags: [Public]
 *     summary: List public services
 *     responses:
 *       200:
 *         description: Public services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceListResponse'
 */
router.get("/services", asyncHandler(PublicSiteController.listServices));

/**
 * @openapi
 * /public/contact:
 *   post:
 *     tags: [Public]
 *     summary: Submit contact message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string, nullable: true }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 id: { type: string }
 */
router.post("/contact", asyncHandler(PublicSiteController.submitContact));

export { router as publicSiteRoutes };
