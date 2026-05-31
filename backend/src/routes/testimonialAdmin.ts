import { Router } from "express";
import multer from "multer";
import { TestimonialController } from "../controllers/TestimonialController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth, requireRole("doctor"));
/**
 * @openapi
 * /testimonials:
 *   get:
 *     tags: [Testimonials]
 *     summary: List testimonials (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Testimonials list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestimonialListResponse'
 */
router.get("/", asyncHandler(TestimonialController.list));

/**
 * @openapi
 * /testimonials:
 *   post:
 *     tags: [Testimonials]
 *     summary: Create testimonial (doctor)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beforeImage: { type: string, format: binary }
 *               afterImage: { type: string, format: binary }
 *               beforeImageUrl: { type: string, nullable: true }
 *               afterImageUrl: { type: string, nullable: true }
 *               clientName: { type: string }
 *               quote: { type: string }
 *               weightLost: { type: string }
 *               duration: { type: string }
 *               rating: { type: number }
 *               isActive: { type: boolean }
 *               order: { type: integer }
 *     responses:
 *       201:
 *         description: Testimonial created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestimonialResponse'
 */
router.post(
  "/",
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  asyncHandler(TestimonialController.create)
);

/**
 * @openapi
 * /testimonials/{id}:
 *   patch:
 *     tags: [Testimonials]
 *     summary: Update testimonial (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beforeImage: { type: string, format: binary }
 *               afterImage: { type: string, format: binary }
 *               beforeImageUrl: { type: string, nullable: true }
 *               afterImageUrl: { type: string, nullable: true }
 *               clientName: { type: string }
 *               quote: { type: string }
 *               weightLost: { type: string }
 *               duration: { type: string }
 *               rating: { type: number }
 *               isActive: { type: boolean }
 *               order: { type: integer }
 *     responses:
 *       200:
 *         description: Testimonial updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestimonialResponse'
 */
router.patch(
  "/:id",
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  asyncHandler(TestimonialController.update)
);

/**
 * @openapi
 * /testimonials/{id}:
 *   delete:
 *     tags: [Testimonials]
 *     summary: Delete testimonial (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Testimonial deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
router.delete("/:id", asyncHandler(TestimonialController.remove));

export { router as testimonialAdminRoutes };
