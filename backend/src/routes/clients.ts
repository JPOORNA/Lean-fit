import { Router } from "express";
import { ClientHistoryController } from "../controllers/ClientHistoryController";
import { ClientAdminController } from "../controllers/ClientAdminController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { clientMealStatusSchema, updateRoleSchema, updateSubscriptionSchema } from "../validators/clients";

const router = Router();

router.use(requireAuth, requireRole("doctor"));

/**
 * @openapi
 * /clients:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients (doctor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 */
router.get("/", asyncHandler(ClientAdminController.listAll));

/**
 * @openapi
 * /clients/{userId}/history:
 *   get:
 *     tags: [Clients]
 *     summary: Get client history (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientHistoryResponse'
 */
router.get("/:userId/history", asyncHandler(ClientHistoryController.getHistory));

/**
 * @openapi
 * /clients/{userId}/meals/status:
 *   get:
 *     tags: [Clients]
 *     summary: Get client meal daily status (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: startDate
 *         in: query
 *         required: true
 *         schema: { type: string, format: date-time }
 *       - name: endDate
 *         in: query
 *         required: true
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Daily meal status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealDayStatusListResponse'
 */
router.get("/:userId/meals/status", validate(clientMealStatusSchema), asyncHandler(ClientHistoryController.getMealDailyStatus));

/**
 * @openapi
 * /clients/{userId}/subscription:
 *   patch:
 *     tags: [Clients]
 *     summary: Update client subscription expiry (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientExpiresAt]
 *             properties:
 *               clientExpiresAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Subscription updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */
router.patch("/:userId/subscription", validate(updateSubscriptionSchema), asyncHandler(ClientAdminController.updateSubscription));

/**
 * @openapi
 * /clients/{userId}/role:
 *   patch:
 *     tags: [Clients]
 *     summary: Update user role (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [client, user] }
 *               clientExpiresAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */
router.patch("/:userId/role", validate(updateRoleSchema), asyncHandler(ClientAdminController.updateRole));

/**
 * @openapi
 * /clients/{userId}:
 *   delete:
 *     tags: [Clients]
 *     summary: Delete a user and purge data (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: refundAll
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
router.delete("/:userId", asyncHandler(ClientAdminController.deleteUser));

export { router as clientRoutes };
