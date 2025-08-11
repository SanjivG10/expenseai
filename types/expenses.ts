// Expense-related types organized by endpoint

// Base expense entity (matches database schema)
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string | null;
  expense_date: string; // YYYY-MM-DD format
  notes?: string;
  receipt_image_url?: string;
  created_at: string;
  updated_at: string;
}

// Expense with populated category data (from database joins)
export interface ExpenseWithCategory extends Expense {
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

// === CREATE EXPENSE ENDPOINT ===
// POST /api/v1/expenses
export interface CreateExpenseRequest {
  amount: number; // Must be > 0.01
  description: string; // 1-255 chars
  category_id: string; // UUID format
  expense_date: string; // YYYY-MM-DD format
  notes?: string; // Max 1000 chars
  receipt_image?: string; // Base64 encoded image
}

export interface CreateExpenseResponse {
  success: boolean;
  message: string;
  data: ExpenseWithCategory;
}

// === UPDATE EXPENSE ENDPOINT ===
// PUT /api/v1/expenses/:id
export interface UpdateExpenseRequest {
  amount?: number; // Must be > 0.01
  description?: string; // 1-255 chars
  category_id?: string; // UUID format
  expense_date?: string; // YYYY-MM-DD format
  notes?: string; // Max 1000 chars
  receipt_image?: string; // Base64 encoded image
}

export interface UpdateExpenseResponse {
  success: boolean;
  message: string;
  data: ExpenseWithCategory;
}

// === DELETE EXPENSE ENDPOINT ===
// DELETE /api/v1/expenses/:id
export interface DeleteExpenseResponse {
  success: boolean;
  message: string;
}

// === EXPENSES SCREEN ENDPOINT ===
// GET /api/v1/screens/expenses
export interface ExpensesScreenQuery {
  page?: number; // Default: 1, min: 1
  limit?: number; // Default: 20, min: 1, max: 100
  search?: string; // Search in description
  category?: string; // UUID of category to filter by
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  sort_by?: 'date' | 'amount' | 'category'; // Default: 'date'
  sort_order?: 'asc' | 'desc'; // Default: 'desc'
}

export interface ExpensesScreenResponse {
  success: boolean;
  message: string;
  data: {
    expenses: ExpenseWithCategory[];
    categories: Array<{
      id: string;
      name: string;
      icon: string;
      color: string;
    }>;
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
  };
}