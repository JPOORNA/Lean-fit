import { Router } from "express";
import multer from "multer";
import { InstagramController } from "../controllers/InstagramController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth, requireRole("doctor"));

/**
 * @openapi
 * /instagram:
 *   get:
 *     tags: [Instagram]
 *     summary: List instagram posts (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Posts list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstagramPostListResponse'
 */
router.get("/", asyncHandler(InstagramController.list));

/**
 * @openapi
 * /instagram:
 *   post:
 *     tags: [Instagram]
 *     summary: Create instagram post (doctor)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail: { type: string, format: binary }
 *               thumbnailUrl: { type: string, nullable: true }
 *               postUrl: { type: string, nullable: true }
 *               caption: { type: string, nullable: true }
 *               type: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstagramPostResponse'
 */
router.post("/", upload.single("thumbnail"), asyncHandler(InstagramController.create));

/**
 * @openapi
 * /instagram/{id}:
 *   patch:
 *     tags: [Instagram]
 *     summary: Update instagram post (doctor)
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
 *               thumbnail: { type: string, format: binary }
 *               thumbnailUrl: { type: string, nullable: true }
 *               postUrl: { type: string, nullable: true }
 *               caption: { type: string, nullable: true }
 *               type: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstagramPostResponse'
 */
router.patch("/:id", upload.single("thumbnail"), asyncHandler(InstagramController.update));

/**
 * @openapi
 * /instagram/{id}:
 *   delete:
 *     tags: [Instagram]
 *     summary: Delete instagram post (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
router.delete("/:id", asyncHandler(InstagramController.remove));

export { router as instagramAdminRoutes };
