import { z } from 'zod';

// Common validation patterns
export const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Auth validation schemas
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyOTPSchema = z.object({
  email: emailSchema,
  token: z
    .string()
    .min(6, 'OTP must be at least 6 characters')
    .max(10, 'OTP must not exceed 10 characters'),
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: z
      .string()
      .min(6, 'OTP must be at least 6 characters')
      .max(10, 'OTP must not exceed 10 characters'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
});

// Screen endpoint query schemas
export const dashboardQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).max(2030).optional(),
});

export const expensesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  sort_by: z.enum(['date', 'amount', 'category']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('month'),
});

// Expense CRUD schemas
export const createExpenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  category_id: z.string().min(1, 'Category ID is required'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  receipt_image: z.string().url('Invalid image URL').optional(), // URL string
});

export const updateExpenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description too long')
    .optional(),
  category_id: z.string().min(1, 'Category ID is required').optional(),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  receipt_image: z.string().url('Invalid image URL').optional(),
});

// Category CRUD schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  icon: z.string().min(1, 'Icon is required').max(50, 'Icon name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long').optional(),
  icon: z.string().min(1, 'Icon is required').max(50, 'Icon name too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
});

// Receipt processing schema
export const processReceiptSchema = z.object({
  image: z.string().min(1, 'Image is required'), // base64 encoded image
});

// Upload image schema
export const uploadImageSchema = z.object({
  image: z.string().min(1, 'Image is required'), // base64 encoded image
});

// Enhanced validation helper with detailed error information
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Create detailed error information
      const errorDetails = {
        validationErrors: error.errors.map((err) => ({
          field: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
        })),
        receivedData: data,
        errorCount: error.errors.length,
      };

      // Create a readable error message
      const message = error.errors
        .map((err) => `${err.path.join('.') || 'root'}: ${err.message}`)
        .join(', ');

      // Create enhanced error with details
      const validationError = new Error(`Validation failed: ${message}`);
      (validationError as any).details = errorDetails;
      (validationError as any).code = 'VALIDATION_ERROR';

      throw validationError;
    }
    throw error;
  }
}

// Validation middleware factory for Express routes
export function validationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      // Validate request body
      const validatedData = validateSchema(schema, req.body);
      req.validatedBody = validatedData;
      next();
    } catch (error: any) {
      console.error('🚫 [VALIDATION ERROR]', {
        endpoint: `${req.method} ${req.originalUrl}`,
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });

      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.details || error.message,
        code: error.code || 'VALIDATION_ERROR',
      });
    }
  };
}

// Type exports
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type VerifyOTPData = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type DashboardQueryData = z.infer<typeof dashboardQuerySchema>;
export type ExpensesQueryData = z.infer<typeof expensesQuerySchema>;
export type AnalyticsQueryData = z.infer<typeof analyticsQuerySchema>;
export type CreateExpenseData = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseData = z.infer<typeof updateExpenseSchema>;
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type ProcessReceiptData = z.infer<typeof processReceiptSchema>;
export type UploadImageData = z.infer<typeof uploadImageSchema>;
