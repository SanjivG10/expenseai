// Category-related types organized by endpoint

// Base category entity (matches database schema)
export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string; // Icon name (e.g., 'restaurant-outline')
  color: string; // Hex color (e.g., '#FF6B6B')
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Category with usage statistics
export interface CategoryWithStats extends Category {
  expense_count?: number;
  total_amount?: number;
}

// === CREATE CATEGORY ENDPOINT ===
// POST /api/v1/categories
export interface CreateCategoryRequest {
  name: string; // 1-100 chars
  icon: string; // 1-50 chars, icon name
  color: string; // Hex color format (#FFFFFF)
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

// === UPDATE CATEGORY ENDPOINT ===
// PUT /api/v1/categories/:id
export interface UpdateCategoryRequest {
  name?: string; // 1-100 chars
  icon?: string; // 1-50 chars, icon name
  color?: string; // Hex color format (#FFFFFF)
}

export interface UpdateCategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

// === DELETE CATEGORY ENDPOINT ===
// DELETE /api/v1/categories/:id
export interface DeleteCategoryResponse {
  success: boolean;
  message: string;
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

export interface GetCategories {
  categories: Category[];
}
