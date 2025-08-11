// Dashboard screen types

// === DASHBOARD SCREEN ENDPOINT ===
// GET /api/v1/screens/dashboard
export interface DashboardScreenQuery {
  month?: number; // 1-12
  year?: number; // e.g., 2024, range: 2020-2030
}

export interface MonthlyStats {
  total: number; // Total amount spent
  expense_count: number; // Number of expenses
  avg_daily: number; // Average daily spending
  categories_count: number; // Number of categories used
}

export interface RecentExpense {
  id: string;
  amount: number;
  description: string;
  category: string; // Category ID
  category_name: string;
  category_icon: string;
  date: string; // YYYY-MM-DD format
}

export interface CalendarExpense {
  id: string;
  amount: number;
  description: string;
  category_name: string;
  category_icon: string;
}

// Calendar data grouped by date
export type CalendarData = Record<string, CalendarExpense[]>; // Key: YYYY-MM-DD

export interface DashboardScreenResponse {
  success: boolean;
  message: string;
  data: {
    monthly_stats: MonthlyStats;
    recent_expenses: RecentExpense[];
    calendar_data: CalendarData;
  };
}