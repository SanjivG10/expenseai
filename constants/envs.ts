// Environment variables and configuration
export const ENV = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',

  // Development/Production flags
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,

  // App Configuration
  APP_NAME: 'ExpenseAI',
  APP_VERSION: '1.0.0',

  // Currency defaults
  DEFAULT_CURRENCY: 'USD',

  // Image processing
  MAX_IMAGE_SIZE: 1024 * 1024 * 2, // 2MB
  IMAGE_QUALITY: 0.8,
} as const;
