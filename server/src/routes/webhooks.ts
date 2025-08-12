import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';

const router = Router();

// Stripe webhook endpoint (no auth required)
router.post('/stripe', subscriptionController.handleStripeWebhook);

export default router;
