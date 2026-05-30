import { Router } from "express";
import { MessageController } from "../controllers/MessageController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";

const router = Router();

router.use(requireAuth, requireRole("doctor"));
/**
 * @openapi
 * /messages:
 *   get:
 *     tags: [Messages]
 *     summary: List contact messages (doctor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageListResponse'
 */
router.get("/", asyncHandler(MessageController.list));

/**
 * @openapi
 * /messages/{id}/read:
 *   patch:
 *     tags: [Messages]
 *     summary: Mark message as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message marked read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.patch("/:id/read", asyncHandler(MessageController.markRead));

/**
 * @openapi
 * /messages/{id}:
 *   delete:
 *     tags: [Messages]
 *     summary: Delete a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
router.delete("/:id", asyncHandler(MessageController.remove));

export { router as messagesAdminRoutes };
