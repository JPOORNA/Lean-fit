import { Router } from "express";
import multer from "multer";
import { ServiceController } from "../controllers/ServiceController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth, requireRole("doctor"));

/**
 * @openapi
 * /admin-services:
 *   get:
 *     tags: [Services]
 *     summary: List services (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceListResponse'
 */
router.get("/", asyncHandler(ServiceController.listAll));

/**
 * @openapi
 * /admin-services:
 *   post:
 *     tags: [Services]
 *     summary: Create service (doctor)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               imageUrl: { type: string, nullable: true }
 *               title: { type: string }
 *               description: { type: string, nullable: true }
 *               benefits: { type: string }
 *               iconName: { type: string }
 *               color: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Service created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 */
router.post("/", upload.single("image"), asyncHandler(ServiceController.create));

/**
 * @openapi
 * /admin-services/{id}:
 *   patch:
 *     tags: [Services]
 *     summary: Update service (doctor)
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
 *               image: { type: string, format: binary }
 *               imageUrl: { type: string, nullable: true }
 *               title: { type: string }
 *               description: { type: string, nullable: true }
 *               benefits: { type: string }
 *               iconName: { type: string }
 *               color: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Service updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 */
router.patch("/:id", upload.single("image"), asyncHandler(ServiceController.update));

/**
 * @openapi
 * /admin-services/{id}:
 *   delete:
 *     tags: [Services]
 *     summary: Delete service (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
router.delete("/:id", asyncHandler(ServiceController.delete));

export { router as serviceRoutes };
