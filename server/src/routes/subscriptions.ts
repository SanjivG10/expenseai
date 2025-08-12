import { Router } from 'express';
import { auth } from '../middleware/auth';
import { subscriptionController } from '../controllers/subscriptionController';

const router = Router();

// All subscription routes require authentication
router.use(auth);

// Subscription management routes
router.post('/create', subscriptionController.createSubscription.bind(subscriptionController));
router.get('/', subscriptionController.getUserSubscription.bind(subscriptionController));
router.post('/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));
router.post('/update-payment-method', subscriptionController.updatePaymentMethod.bind(subscriptionController));

export default router;