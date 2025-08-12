import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  completeOnboarding,
  getUserPreferences,
  updateUserPreferences,
  getSpendingProgress,
  updatePushToken,
} from '../controllers/preferencesController';
import { onboardingSchema, updatePreferencesSchema } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Onboarding completion
router.post('/onboarding/complete', validate(onboardingSchema, 'body'), completeOnboarding);

// User preferences CRUD
router.get('/', getUserPreferences);
router.put('/', validate(updatePreferencesSchema, 'body'), updateUserPreferences);

// Spending progress for notifications
router.get('/spending-progress', getSpendingProgress);

// Push token management
router.post('/push-token', updatePushToken);

export default router;
