import { Router } from 'express';
import { auth } from '../middleware/auth';
import { revenueCatController } from '../controllers/revenueCatController';

const router = Router();

// RevenueCat webhook endpoint (no auth required)
router.post('/webhook', revenueCatController.handleWebhook);

// Authenticated routes
router.use(auth);

// Subscription management routes
router.get('/subscription-status', revenueCatController.getSubscriptionStatus);
router.post('/cancel-subscription', revenueCatController.cancelSubscription);

export default router;
