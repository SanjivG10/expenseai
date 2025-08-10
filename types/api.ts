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
  amount: number;
  description: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  date: string;
  notes?: string;
  receiptImage?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  expenseCount?: number;
  userId?: string;
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
  monthlyStats: {
    total: number;
    expenseCount: number;
    avgDaily: number;
    categoriesCount: number;
  };
  recentExpenses: Expense[];
  calendarData: Record<string, Expense[]>;
}

// Expenses Screen Response
export interface ExpensesResponse {
  expenses: Expense[];
  categories: Category[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
  };
  summary: {
    totalExpenses: number;
    filteredTotal: number;
  };
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
    thisMonth: { total: number; change: string };
    avgDaily: { amount: number; change: string };
    totalCategories: number;
    totalTransactions: number;
    topCategory: string;
  };
  spendingTrends: {
    labels: string[];
    data: number[];
  };
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  monthlyComparison: {
    labels: string[];
    data: number[];
  };
}

export interface AnalyticsQuery {
  period?: 'week' | 'month' | 'year';
}

// Settings Screen Response
export interface SettingsResponse {
  userProfile: UserProfile;
  categories: Category[];
  preferences: {
    currency: string;
    notifications: boolean;
    defaultCategory: string;
  };
}

// Camera/Receipt Processing
export interface ProcessReceiptRequest {
  image: string; // base64 encoded
}

export interface ProcessReceiptResponse {
  extractedData: {
    amount: number;
    merchantName: string;
    date: string;
    suggestedCategory: string;
    items: string[];
    confidence: number;
  };
  categories: Category[];
  formDefaults: {
    date: string;
    currency: string;
  };
}