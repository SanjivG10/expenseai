export const ROUTES = {
  // Tab Routes
  HOME: '/',
  DASHBOARD: '/',
  CAMERA: '/camera',
  EXPENSES: '/expenses',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',

  // Modal/Stack Routes
  ADD_EXPENSE: '/add-expense',
  EDIT_EXPENSE: '/edit-expense',
  EXPENSE_DETAIL: '/expense-detail',
  CATEGORY_MANAGEMENT: '/category-management',
  RECEIPT_PREVIEW: '/receipt-preview',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: '/api/v1',

  // Expense endpoints
  EXPENSES: '/expenses',
  EXPENSE_BY_ID: (id: string) => `/expenses/${id}`,

  // Category endpoints
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // AI/Receipt processing
  PROCESS_RECEIPT: '/ai/process-receipt',

  // Analytics
  ANALYTICS: '/analytics',
  MONTHLY_STATS: '/analytics/monthly',
  CATEGORY_STATS: '/analytics/categories',
} as const;
