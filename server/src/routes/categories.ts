import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { 
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoriesController';
import { createCategorySchema, updateCategorySchema } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Individual CRUD operations for categories
router.post('/', validate(createCategorySchema, 'body'), createCategory);
router.put('/:id', validate(updateCategorySchema, 'body'), updateCategory);
router.delete('/:id', deleteCategory);

export default router;