import { Router } from 'express';
import {
  getAnalyticsData,
  getCategoriesData,
  getDashboardData,
  getExpensesData,
  processReceiptImage,
} from '../controllers/screensController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  analyticsQuerySchema,
  dashboardQuerySchema,
  expensesQuerySchema,
  processReceiptSchema,
} from '../utils/validation';

const router = Router();

// Apply authentication middleware to all screen routes
router.use(auth);

// Screen-centric endpoints
router.get('/dashboard', validate(dashboardQuerySchema, 'query'), getDashboardData);
router.get('/expenses', validate(expensesQuerySchema, 'query'), getExpensesData);
router.get('/analytics', validate(analyticsQuerySchema, 'query'), getAnalyticsData);
router.get('/categories', getCategoriesData);
router.post('/camera/process-receipt', validate(processReceiptSchema, 'body'), processReceiptImage);

export default router;
