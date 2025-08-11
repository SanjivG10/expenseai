// Centralized type exports - organized by endpoint

// Common types
export * from './common';

// Authentication types
export * from './auth';

// Dashboard screen types
export * from './dashboard';

// Expenses types (CRUD + screen)
export * from './expenses';

// Categories types (CRUD)
export * from './categories';

// Analytics screen types
export * from './analytics';

// Settings screen types
export * from './settings';

// Camera/Receipt processing types
export * from './camera';

// Legacy compatibility - re-export some common types with old names
// TODO: Remove these after migrating all components to use new organized structure
export type { ApiResponse, ApiError } from './common';
export type { Category, CategoryWithStats } from './categories';
export type { Expense, ExpenseWithCategory } from './expenses';

// Type maps for validation
export const ENDPOINT_REQUEST_TYPES = {
  // Auth endpoints
  'POST /api/v1/auth/signup': 'SignupRequest',
  'POST /api/v1/auth/login': 'LoginRequest',
  'POST /api/v1/auth/refresh': 'RefreshTokenRequest',
  'POST /api/v1/auth/forgot-password': 'ForgotPasswordRequest',
  'POST /api/v1/auth/reset-password': 'ResetPasswordRequest',
  'POST /api/v1/auth/verify-otp': 'VerifyOTPRequest',
  
  // Screen endpoints
  'GET /api/v1/screens/dashboard': 'DashboardScreenQuery',
  'GET /api/v1/screens/expenses': 'ExpensesScreenQuery', 
  'GET /api/v1/screens/analytics': 'AnalyticsScreenQuery',
  'GET /api/v1/screens/settings': 'null', // No query params
  'POST /api/v1/screens/camera/process-receipt': 'ProcessReceiptRequest',
  
  // CRUD endpoints
  'POST /api/v1/expenses': 'CreateExpenseRequest',
  'PUT /api/v1/expenses/:id': 'UpdateExpenseRequest',
  'POST /api/v1/categories': 'CreateCategoryRequest',
  'PUT /api/v1/categories/:id': 'UpdateCategoryRequest',
  'PUT /api/v1/users/profile': 'UpdateProfileRequest',
} as const;

export const ENDPOINT_RESPONSE_TYPES = {
  // Auth endpoints
  'POST /api/v1/auth/signup': 'SignupResponse',
  'POST /api/v1/auth/login': 'LoginResponse',
  'POST /api/v1/auth/logout': 'LogoutResponse',
  'POST /api/v1/auth/refresh': 'RefreshTokenResponse',
  'POST /api/v1/auth/forgot-password': 'ForgotPasswordResponse',
  'POST /api/v1/auth/reset-password': 'ResetPasswordResponse',
  'POST /api/v1/auth/verify-otp': 'VerifyOTPResponse',
  'GET /api/v1/auth/profile': 'GetProfileResponse',
  
  // Screen endpoints
  'GET /api/v1/screens/dashboard': 'DashboardScreenResponse',
  'GET /api/v1/screens/expenses': 'ExpensesScreenResponse',
  'GET /api/v1/screens/analytics': 'AnalyticsScreenResponse', 
  'GET /api/v1/screens/settings': 'SettingsScreenResponse',
  'POST /api/v1/screens/camera/process-receipt': 'ProcessReceiptResponse',
  
  // CRUD endpoints
  'POST /api/v1/expenses': 'CreateExpenseResponse',
  'PUT /api/v1/expenses/:id': 'UpdateExpenseResponse',
  'DELETE /api/v1/expenses/:id': 'DeleteExpenseResponse',
  'POST /api/v1/categories': 'CreateCategoryResponse',
  'PUT /api/v1/categories/:id': 'UpdateCategoryResponse',
  'DELETE /api/v1/categories/:id': 'DeleteCategoryResponse',
  'PUT /api/v1/users/profile': 'UpdateProfileResponse',
} as const;