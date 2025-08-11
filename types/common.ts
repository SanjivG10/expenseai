// Common API types used across all endpoints

// Generic API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

// Generic API Error response
export interface ApiError {
  success: false;
  message: string;
  code?: string;
  error?: string;
  details?: any;
}

// Common pagination structure
export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  has_more: boolean;
}

// Generic query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Date range filters
export interface DateRangeFilter {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
}

// Common timestamp fields
export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

// Health check response
export interface HealthCheckResponse {
  success: boolean;
  message: string;
  data?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    database: 'connected' | 'disconnected';
    version: string;
  };
}