import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate";
import { loginSchema, registerSchema, refreshSchema } from "../validators/auth";
import { requireAuth } from "../middlewares/auth";
import { validateCaptcha } from "../middlewares/captcha";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a user
 *     description: Create a doctor, client, or normal user account. Tokens are sent via httpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role, whatsappNumber, captchaToken]
 *             properties:
 *               name: { type: string, example: "Asha" }
 *               email: { type: string, example: "asha@example.com" }
 *               password: { type: string, example: "StrongPass123" }
 *               role: { type: string, enum: [doctor, client, user] }
 *               whatsappNumber: { type: string, example: "+919876543210" }
 *               captchaToken: { type: string, example: "0.1A2B3C..." }
 *               bootstrapKey: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       409:
 *         description: Email or doctor already exists
 */
router.post("/register", validateCaptcha, validate(registerSchema), asyncHandler(AuthController.register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     description: Login with email and password. Tokens are sent via httpOnly cookies (not in response body).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, captchaToken]
 *             properties:
 *               email: { type: string, example: "asha@example.com" }
 *               password: { type: string, example: "StrongPass123" }
 *               captchaToken: { type: string, example: "0.1A2B3C..." }
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateCaptcha, validate(loginSchema), asyncHandler(AuthController.login));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Refresh the access token using the refresh token from cookies. New tokens are sent via httpOnly cookies.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", validate(refreshSchema), asyncHandler(AuthController.refresh));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       204:
 *         description: Logged out
 */
router.post("/logout", requireAuth, asyncHandler(AuthController.logout));

export { router as authRoutes };
