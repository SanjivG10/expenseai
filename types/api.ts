// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  details?: any;
}

// Expense Types
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string | null;
  expense_date: string;
  notes?: string;
  receipt_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  receiptImage?: string;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {}

// Category Types
export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// User Profile Types
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}

// Dashboard Screen Response
export interface DashboardResponse {
  monthly_stats: {
    total: number;
    expense_count: number;
    avg_daily: number;
    categories_count: number;
  };
  recent_expenses: RecentExpense[];
  calendar_data: Record<string, CalendarExpense[]>;
}

// Recent expense for dashboard (simplified structure)
export interface RecentExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  category_name: string;
  category_icon: string;
  date: string;
}

// Calendar expense (simplified structure)
export interface CalendarExpense {
  id: string;
  amount: number;
  description: string;
  category_name: string;
  category_icon: string;
}

// Expenses Screen Response
export interface ExpensesResponse {
  expenses: ExpenseWithCategory[];
  categories: Category[];
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

// Expense with category information
export interface ExpenseWithCategory {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string | null;
  expense_date: string;
  notes?: string;
  receipt_image_url?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface ExpensesQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// Analytics Screen Response
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
  category_breakdown: CategoryBreakdown[];
  monthly_comparison: {
    labels: string[];
    data: number[];
  };
}

// Category breakdown for analytics
export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount: number;
  percentage: number;
  expense_count: number;
}

export interface AnalyticsQuery {
  period?: 'week' | 'month' | 'year';
}

// Settings Screen Response
export interface SettingsResponse {
  user_profile: any; // Will use Supabase User type
  categories: CategoryWithStats[];
  preferences: UserPreferences;
}

// Category with usage statistics
export interface CategoryWithStats {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  expense_count?: number;
  total_amount?: number;
}

// User preferences from backend
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

// Camera/Receipt Processing
export interface ProcessReceiptRequest {
  image: string; // base64 encoded
}

export interface ProcessReceiptResponse {
  receipt_image_url: string;
  receipt_text: string;
}