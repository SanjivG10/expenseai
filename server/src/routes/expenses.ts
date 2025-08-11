import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceiptImage,
} from '../controllers/expensesController';
import { createExpenseSchema, updateExpenseSchema, uploadImageSchema } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Individual CRUD operations for expenses
router.post('/', validate(createExpenseSchema, 'body'), createExpense);
router.put('/:id', validate(updateExpenseSchema, 'body'), updateExpense);
router.delete('/:id', deleteExpense);

// Upload receipt image
router.post('/upload-receipt', validate(uploadImageSchema, 'body'), uploadReceiptImage);

export default router;
