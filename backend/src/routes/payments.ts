import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createGroupOrderSchema, createOrderSchema, updateGroupPaymentStatusSchema, verifySchema } from "../validators/payment";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /payments/orders:
 *   post:
 *     tags: [Payments]
 *     summary: Create Razorpay order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentId]
 *             properties:
 *               appointmentId: { type: string }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentOrderResponse'
 */
router.post("/orders", validate(createOrderSchema), asyncHandler(PaymentController.createOrder));
/**
 * @openapi
 * /payments/group-orders:
 *   post:
 *     tags: [Payments]
 *     summary: Create Razorpay group session order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groupSessionSlotId]
 *             properties:
 *               groupSessionSlotId: { type: string }
 *     responses:
 *       201:
 *         description: Group order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentOrderResponse'
 */
router.post("/group-orders", validate(createGroupOrderSchema), asyncHandler(PaymentController.createGroupOrder));

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentId, signature]
 *             properties:
 *               orderId: { type: string }
 *               paymentId: { type: string }
 *               signature: { type: string }
 *     responses:
 *       200:
 *         description: Payment verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 */
router.post("/verify", validate(verifySchema), asyncHandler(PaymentController.verify));
/**
 * @openapi
 * /payments/group-verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay group payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentId, signature]
 *             properties:
 *               orderId: { type: string }
 *               paymentId: { type: string }
 *               signature: { type: string }
 *     responses:
 *       200:
 *         description: Group payment verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 */
router.post("/group-verify", validate(verifySchema), asyncHandler(PaymentController.verifyGroup));

/**
 * @openapi
 * /payments/group/{groupSessionSlotId}/refresh:
 *   patch:
 *     tags: [Payments]
 *     summary: Refresh group payment status (client)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: groupSessionSlotId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Refreshed payment status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 */
router.patch("/group/:groupSessionSlotId/refresh", asyncHandler(PaymentController.refreshGroupPaymentStatus));

/**
 * @openapi
 * /payments/group/{id}/status:
 *   patch:
 *     tags: [Payments]
 *     summary: Manually update group payment status (doctor)
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [created, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Payment status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 */
router.patch("/group/:id/status", requireRole("doctor"), validate(updateGroupPaymentStatusSchema), asyncHandler(PaymentController.updateGroupPaymentStatus));

/**
 * Doctor only routes
 */
/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: List all payments (doctor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentsListResponse'
 */
router.get("/", requireRole("doctor"), asyncHandler(PaymentController.listAll));
/**
 * @openapi
 * /payments/{id}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund a payment (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Refund processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 */
router.post("/:id/refund", requireRole("doctor"), asyncHandler(PaymentController.refund));

export { router as paymentRoutes };
