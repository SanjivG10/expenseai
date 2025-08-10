import { ENV } from './envs';

export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL.replace('/api/v1', '') || 'http://localhost:3000',
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

  // Health check
  HEALTH: '/health',
  AUTH_HEALTH: '/auth/health',
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