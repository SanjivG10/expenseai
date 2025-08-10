import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { 
  getDashboardData,
  getExpensesData,
  getAnalyticsData,
  getSettingsData,
  processReceiptImage
} from '../controllers/screensController';
import { analyticsQuerySchema, expensesQuerySchema, processReceiptSchema } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all screen routes
router.use(auth);

// Screen-centric endpoints
router.get('/dashboard', getDashboardData);
router.get('/expenses', validate(expensesQuerySchema, 'query'), getExpensesData);
router.get('/analytics', validate(analyticsQuerySchema, 'query'), getAnalyticsData);
router.get('/settings', getSettingsData);
router.post('/camera/process-receipt', validate(processReceiptSchema, 'body'), processReceiptImage);

export default router;