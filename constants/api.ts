import { ENV } from './envs';

export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL || 'http://localhost:3000',
  VERSION: 'v1',
  TIMEOUT: 10000, // 10 seconds
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_REFRESH_TOKEN: '/auth/refresh',
  AUTH_PROFILE: '/auth/profile',

  // Screen-centric endpoints
  SCREEN_DASHBOARD: '/screens/dashboard',
  SCREEN_EXPENSES: '/screens/expenses',
  SCREEN_ANALYTICS: '/screens/analytics',
  SCREEN_CAMERA_PROCESS: '/screens/camera/process-receipt',
  SCREEN_CATEGORIES: '/screens/categories',

  // Individual CRUD operations
  EXPENSES: '/expenses',
  EXPENSE_BY_ID: '/expenses/:id',
  EXPENSE_UPLOAD_RECEIPT: '/expenses/upload-receipt',
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: '/categories/:id',
  USERS_PROFILE: '/users/profile',

  // Preferences and onboarding
  ONBOARDING_COMPLETE: '/preferences/onboarding/complete',
  PREFERENCES: '/preferences',

  // Notification testing
  NOTIFICATIONS_TEST_DAILY: '/notifications/test-daily',
  NOTIFICATIONS_TEST_WEEKLY: '/notifications/test-weekly',
  NOTIFICATIONS_TEST_MONTHLY: '/notifications/test-monthly',

  // Health check
  HEALTH: '/health',
  AUTH_HEALTH: '/auth/health',

  // Push token
  PREFERENCES_PUSH_TOKEN: '/preferences/push-token',
  PREFERENCES_SPENDING_PROGRESS: '/preferences/spending-progress',

  // Subscriptions and payments
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTION_CREATE: '/subscriptions/create',
  SUBSCRIPTION_CANCEL: '/subscriptions/cancel',
  SUBSCRIPTION_UPDATE_PAYMENT_METHOD: '/subscriptions/update-payment-method',
  PAYMENT_INTENT_CREATE: '/payments/create-intent',
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  buildApiUrl,
};
