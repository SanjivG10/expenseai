// Legacy API types for backward compatibility
// Note: Most types are now organized in individual files (auth.ts, expenses.ts, etc.)

// Legacy API Response wrapper (duplicate of common.ts - kept for backward compatibility)
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

// Legacy API Error response (duplicate of common.ts - kept for backward compatibility)
export interface ApiError {
  success: false;
  message: string;
  code: string;
  details?: any;
}

// Legacy types that might still be used in some parts of the codebase
// These should be gradually migrated to the organized type files

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
}

// Legacy dashboard response (use DashboardScreenResponse from dashboard.ts instead)
export interface DashboardResponse {
  monthly_stats: {
    total: number;
    expense_count: number;
    avg_daily: number;
    categories_count: number;
  };
  recent_expenses: any[]; // Use RecentExpense from dashboard.ts
  calendar_data: Record<string, any[]>; // Use CalendarData from dashboard.ts
}

// Legacy expenses response (use ExpensesScreenResponse from expenses.ts instead)
export interface ExpensesResponse {
  expenses: any[]; // Use ExpenseWithCategory from expenses.ts
  categories: any[]; // Use Category from categories.ts
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    has_more: boolean;
  };
  summary: {
    total_expenses: number;
    filtered_total: number;
  };
}

// Legacy analytics response (use AnalyticsScreenResponse from analytics.ts instead)
export interface AnalyticsResponse {
  period: 'week' | 'month' | 'year';
  summary: {
    this_month: { total: number; change: string };
    avg_daily: { amount: number; change: string };
    total_categories: number;
    total_transactions: number;
    top_category: string;
  };
  spending_trends: {
    labels: string[];
    data: number[];
  };
  category_breakdown: any[]; // Use CategoryBreakdown from categories.ts
  monthly_comparison: {
    labels: string[];
    data: number[];
  };
}

// Legacy settings response (use SettingsScreenResponse from settings.ts instead)
export interface SettingsResponse {
  user_profile: any; // Will use Supabase User type
  categories: any[]; // Use CategoryWithStats from categories.ts
  preferences: any; // Use UserPreferences from preferences.ts
}

// Legacy user preferences (use UserPreferences from preferences.ts instead)
export interface UserPreferences {
  user_id: string;
  default_category_id?: string;
  budget_monthly?: number;
  budget_enabled: boolean;
  export_format: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

// Legacy process receipt types (use ProcessReceiptRequest/Response from camera.ts instead)
export interface ProcessReceiptRequest {
  image: string; // base64 encoded
}

export interface ProcessReceiptResponse {
  receipt_image_url: string;
  receipt_text: string;
}
