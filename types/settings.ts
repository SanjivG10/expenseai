// Settings screen types

import { CategoryWithStats } from './categories';

// User settings structure (legacy - use preferences.ts instead)
export interface UserSettings {
  user_id: string;
  default_category_id?: string;
  budget_monthly?: number;
  budget_enabled: boolean;
  export_format: string; // e.g., 'csv', 'pdf', 'excel'
  theme: string; // e.g., 'light', 'dark', 'auto'
  created_at: string;
  updated_at: string;
}

// User profile (from Supabase Auth)
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
}

// === SETTINGS SCREEN ENDPOINT ===
// GET /api/v1/screens/settings
export interface SettingsScreenResponse {
  success: boolean;
  message: string;
  data: {
    user_profile: any; // Uses Supabase User type
    categories: CategoryWithStats[];
  };
}

// === UPDATE USER PROFILE ENDPOINT ===
// PUT /api/v1/users/profile
export interface UpdateProfileRequest {
  firstName?: string; // 2-50 chars, letters/spaces/hyphens/apostrophes only
  lastName?: string; // 2-50 chars, letters/spaces/hyphens/apostrophes only
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: any; // Supabase User object
}