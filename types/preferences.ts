// User preferences types for onboarding and settings

export interface UserPreferences {
  id: string;
  user_id: string;

  // Budget limits (in dollars, converted from cents in DB)
  daily_budget?: number;
  weekly_budget?: number;
  monthly_budget?: number;

  // Notification settings
  notifications_enabled: boolean;
  daily_notifications: boolean;
  weekly_notifications: boolean;
  monthly_notifications: boolean;

  // Notification times (stored as minutes from midnight in user's timezone)
  daily_notification_time: number; // Default: 1260 (21:00/9 PM)
  weekly_notification_time: number; // Default: 600 (10:00 AM Sunday)
  monthly_notification_time: number; // Default: 600 (10:00 AM last day)

  // User timezone for proper notification scheduling
  timezone: string; // Default: detected from device or 'America/New_York'

  currency: string; // Default: 'USD'
  onboarding_completed: boolean;

  // Push notification token for FCM/Expo push
  push_token?: string;

  created_at: string;
  updated_at: string;
}

// === ONBOARDING ENDPOINT ===
// POST /api/v1/onboarding/complete
export interface OnboardingRequest {
  daily_budget?: number; // Optional daily spending limit in dollars
  weekly_budget?: number; // Optional weekly spending limit in dollars
  monthly_budget?: number; // Optional monthly spending limit in dollars
  notifications_enabled: boolean;
  currency?: string; // Default: 'USD'
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  data: UserPreferences;
}

// === USER PREFERENCES ENDPOINT ===
// GET /api/v1/preferences
export interface GetPreferencesResponse {
  success: boolean;
  message: string;
  data: UserPreferences;
}

// PUT /api/v1/preferences
export interface UpdatePreferencesRequest {
  daily_budget?: number;
  weekly_budget?: number;
  monthly_budget?: number;
  notifications_enabled?: boolean;
  daily_notifications?: boolean;
  weekly_notifications?: boolean;
  monthly_notifications?: boolean;
  daily_notification_time?: number;
  weekly_notification_time?: number;
  monthly_notification_time?: number;
  timezone?: string;
  currency?: string;
  push_token?: string;
}

export interface UpdatePreferencesResponse {
  success: boolean;
  message: string;
  data: UserPreferences;
}

// === NOTIFICATION TESTING ENDPOINTS ===
// POST /api/v1/notifications/test-daily
// POST /api/v1/notifications/test-weekly
// POST /api/v1/notifications/test-monthly
export interface TestNotificationResponse {
  success: boolean;
  message: string;
  data?: {
    notification_sent: boolean;
    notification_content: string;
  };
}

// Helper type for time conversion
export interface NotificationTime {
  hours: number; // 0-23
  minutes: number; // 0-59
}

// Helper functions for time conversion
export const minutesToTime = (minutes: number): NotificationTime => ({
  hours: Math.floor(minutes / 60),
  minutes: minutes % 60,
});

export const timeToMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;

// Helper function to format time for display
export const formatNotificationTime = (minutes: number): string => {
  const time = minutesToTime(minutes);
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hours12 = time.hours === 0 ? 12 : time.hours > 12 ? time.hours - 12 : time.hours;
  return `${hours12}:${time.minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to detect user's timezone
export const detectUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect timezone:', error);
    return 'America/New_York'; // Fallback timezone
  }
};

// Common timezone options for settings
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Phoenix', label: 'Arizona Time (Phoenix)' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Europe/Berlin', label: 'CET (Berlin)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Asia/Kolkata', label: 'IST (Mumbai)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
];
