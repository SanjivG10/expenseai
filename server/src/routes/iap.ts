import { Router } from 'express';
import { auth } from '../middleware/auth';
import { iapController } from '../controllers/iapController';

const router = Router();

// All IAP routes require authentication
router.use(auth);

// IAP management routes
router.post('/verify-purchase', iapController.verifyPurchase);
router.post('/restore-purchases', iapController.restorePurchases);
router.get('/subscription-status', iapController.getSubscriptionStatus);
router.post('/cancel-subscription', iapController.cancelSubscription);

export default router;
