import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateProfile } from '../controllers/usersController';
import { updateProfileSchema } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Individual CRUD operations for user profile
router.put('/profile', validate(updateProfileSchema, 'body'), updateProfile);

export default router;