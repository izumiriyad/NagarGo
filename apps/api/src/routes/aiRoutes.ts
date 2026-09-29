import { Router } from "express";
import { aiChat } from "../controllers/aiController";

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: NagarGo AI Assistant chat endpoint
 *     description: Rule-based conversational assistant covering delivery, rider onboarding, pricing, OTP, medicine, payment and dispute topics.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "How does bKash payment work?"
 *               history:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     text:
 *                       type: string
 *     responses:
 *       200:
 *         description: Assistant reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 */

const router = Router();

// Public — no auth required for the AI assistant
router.post("/ai/chat", aiChat);

export default router;
