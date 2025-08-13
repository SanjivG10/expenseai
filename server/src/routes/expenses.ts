import { Router } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceiptImage,
  processReceipt,
  processVoice,
} from '../controllers/expensesController';
import { createExpenseSchema, updateExpenseSchema, uploadImageSchema } from '../utils/validation';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('file:', file);
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// Apply authentication middleware to all routes
router.use(auth);

// Individual CRUD operations for expenses
router.put('/:id', validate(updateExpenseSchema, 'body'), updateExpense);
router.delete('/:id', deleteExpense);

// Upload receipt image
router.post('/upload-receipt', validate(uploadImageSchema, 'body'), uploadReceiptImage);

// Process receipt with AI
router.post('/process-receipt', processReceipt);
router.post('/process-voice', upload.single('audio'), processVoice);
router.post('/', validate(createExpenseSchema, 'body'), createExpense);

export default router;
