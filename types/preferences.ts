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
  
  // Notification times (stored as minutes from midnight)
  daily_notification_time: number;    // Default: 1260 (21:00/9 PM)
  weekly_notification_time: number;   // Default: 600 (10:00 AM Sunday)
  monthly_notification_time: number;  // Default: 600 (10:00 AM last day)
  
  currency: string; // Default: 'USD'
  onboarding_completed: boolean;
  
  created_at: string;
  updated_at: string;
}

// === ONBOARDING ENDPOINT ===
// POST /api/v1/onboarding/complete
export interface OnboardingRequest {
  daily_budget?: number;     // Optional daily spending limit in dollars
  weekly_budget?: number;    // Optional weekly spending limit in dollars  
  monthly_budget?: number;   // Optional monthly spending limit in dollars
  notifications_enabled: boolean;
  currency?: string;         // Default: 'USD'
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
  currency?: string;
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
  hours: number;   // 0-23
  minutes: number; // 0-59
}

// Helper functions for time conversion
export const minutesToTime = (minutes: number): NotificationTime => ({
  hours: Math.floor(minutes / 60),
  minutes: minutes % 60
});

export const timeToMinutes = (hours: number, minutes: number): number => 
  hours * 60 + minutes;

// Helper function to format time for display
export const formatNotificationTime = (minutes: number): string => {
  const time = minutesToTime(minutes);
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hours12 = time.hours === 0 ? 12 : time.hours > 12 ? time.hours - 12 : time.hours;
  return `${hours12}:${time.minutes.toString().padStart(2, '0')} ${period}`;
};