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
    timezone: z.string().optional(),
    whatsappNumber: z.string().optional()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, "Password must be at least 8 characters long")
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
 *               whatsappNumber: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */
router.patch("/", validate(updateProfileSchema), asyncHandler(ProfileController.updateProfile));

/**
 * @openapi
 * /profile/password:
 *   put:
 *     tags: [Profile]
 *     summary: Change own password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, minLength: 8, example: "newSecurePass123" }
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
router.put("/password", validate(changePasswordSchema), asyncHandler(ProfileController.changePassword));

export { router as profileRoutes };
