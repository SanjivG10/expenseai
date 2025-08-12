// Environment variables and configuration
export const ENV = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',

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

  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',

  STRIPE_PRODUCT_ID: process.env.EXPO_PUBLIC_STRIPE_PRODUCT_ID || 'prod_SqusXfCH0TclQN',
  STRIPE_WEEKLY_PRICE_ID:
    process.env.EXPO_PUBLIC_STRIPE_WEEKLY_PRICE_ID || 'price_1RvD2oICyWezkIPxK6kdStQL',
  STRIPE_MONTHLY_PRICE_ID:
    process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1RvD2oICyWezkIPxc68F4SHg',
  STRIPE_YEARLY_PRICE_ID:
    process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_1RvD2oICyWezkIPxFaVewMCW',
} as const;
