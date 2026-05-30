import { Router } from "express";
import { ProfileController } from "../controllers/ProfileController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";
import { validate } from "../middlewares/validate";

const router = Router();

router.use(requireAuth);

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    timezone: z.string().optional()
  })
});

/**
 * @openapi
 * /profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Update own profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               timezone: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */
router.patch("/", validate(updateProfileSchema), asyncHandler(ProfileController.updateProfile));

export { router as profileRoutes };
