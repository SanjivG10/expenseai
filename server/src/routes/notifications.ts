import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  testDailyNotification,
  testWeeklyNotification,
  testMonthlyNotification
} from '../controllers/notificationController';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Test notification endpoints for development
router.post('/test-daily', testDailyNotification);
router.post('/test-weekly', testWeeklyNotification);
router.post('/test-monthly', testMonthlyNotification);

export default router;