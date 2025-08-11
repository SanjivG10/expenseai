// Analytics screen types

import { CategoryBreakdown } from './categories';

// === ANALYTICS SCREEN ENDPOINT ===
// GET /api/v1/screens/analytics
export interface AnalyticsScreenQuery {
  period?: 'week' | 'month' | 'year'; // Default: 'month'
}

export interface AnalyticsScreenResponse {
  success: boolean;
  message: string;
  data: {
    period: 'week' | 'month' | 'year';
    summary: {
      this_month: { 
        total: number; 
        change: string; // e.g., "+12%" or "-5%"
      };
      avg_daily: { 
        amount: number; 
        change: string; // e.g., "+12%" or "-5%"
      };
      total_categories: number;
      total_transactions: number;
      top_category: string; // Category name
    };
    spending_trends: {
      labels: string[]; // e.g., ["Week 1", "Week 2", "Week 3", "Week 4"]
      data: number[]; // Corresponding amounts
    };
    category_breakdown: CategoryBreakdown[];
    monthly_comparison: {
      labels: string[]; // e.g., ["Dec", "Jan", "Feb", "Mar", "Apr"]
      data: number[]; // Corresponding amounts for each month
    };
  };
}