// Database types for ExpenseAI backend

// Note: UserProfile is handled by Supabase Auth directly
// We'll use the User interface from the auth service instead

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

// Item breakdown for expenses
export interface ExpenseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string | null;
  expense_date: string; // ISO date string
  notes?: string;
  receipt_image_url?: string;
  item_breakdowns?: ExpenseItem[];
  created_at: string;
  updated_at: string;
}

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

// Enhanced types for API responses (with joins)
export interface ExpenseWithCategory extends Expense {
  category?: Category;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface CategoryWithStats extends Category {
  expense_count?: number;
  total_amount?: number;
}

// Analytics types
export interface MonthlyStats {
  total: number;
  expense_count: number;
  avg_daily: number;
  categories_count: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount: number;
  percentage: number;
  expense_count: number;
}

export interface SpendingTrend {
  date: string;
  amount: number;
  expense_count: number;
}

export interface RecentExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  category_name: string;
  category_icon: string;
  date: string;
}

// Calendar data type
export interface CalendarExpense {
  id: string;
  amount: number;
  description: string;
  category_name: string;
  category_icon: string;
}

export type CalendarData = Record<string, CalendarExpense[]>;

// Screen API response types
export interface DashboardData {
  monthly_stats: MonthlyStats;
  recent_expenses: RecentExpense[];
  calendar_data: CalendarData;
  budget_progress: {
    daily: {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
    } | null;
    weekly: {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
    } | null;
    monthly: {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
    } | null;
  } | null;
}

export interface ExpensesScreenData {
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

export interface AnalyticsData {
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

export interface GetCategories {
  categories: Category[];
}

export interface ProcessReceiptResponse {
  receipt_image_url: string;
  receipt_text: string;
}
