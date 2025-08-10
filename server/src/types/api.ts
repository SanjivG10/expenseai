// API response types for ExpenseAI backend

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  status: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ExpensesQuery extends PaginationQuery {
  search?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'date' | 'amount' | 'category';
  sort_order?: 'asc' | 'desc';
}

export interface AnalyticsQuery {
  period?: 'week' | 'month' | 'year';
}

// Request body types
export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category_id: string;
  expense_date: string;
  notes?: string;
  receipt_image?: string; // base64 or file upload
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
  id: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  currency?: string;
  date_format?: string;
  notifications_enabled?: boolean;
}

export interface ProcessReceiptRequest {
  image: string; // base64 encoded image
}

export interface ProcessReceiptResponse {
  extracted_data: {
    amount: number;
    merchant_name: string;
    date: string;
    suggested_category: string;
    items: string[];
    confidence: number;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  form_defaults: {
    date: string;
    currency: string;
  };
}

// Validation schemas (to be used with Zod)
export interface CreateExpenseSchema {
  amount: number;
  description: string;
  category_id: string;
  expense_date: string;
  notes?: string;
}

export interface UpdateExpenseSchema extends Partial<CreateExpenseSchema> {}

export interface CreateCategorySchema {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategorySchema extends Partial<CreateCategorySchema> {}