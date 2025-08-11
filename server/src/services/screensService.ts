import { addDays, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { supabaseAdmin } from '../config/supabase';
import {
  AnalyticsData,
  CalendarData,
  Category,
  CategoryBreakdown,
  DashboardData,
  ExpensesScreenData,
  ExpenseWithCategory,
  MonthlyStats,
  ProcessReceiptResponse,
  RecentExpense,
  GetCategories,
} from '../types/database';
import { DashboardQueryData, AnalyticsQueryData, ExpensesQueryData } from '../utils/validation';

// Get dashboard data (monthly stats, recent expenses, calendar)
export const getDashboardDataService = async (
  userId: string,
  query?: DashboardQueryData
): Promise<DashboardData> => {
  // Use provided month/year or default to current
  const targetDate = new Date(
    query?.year ?? new Date().getFullYear(),
    (query?.month ?? new Date().getMonth() + 1) - 1, // Convert 1-12 to 0-11
    1
  );
  const startOfCurrentMonth = startOfMonth(targetDate);
  const endOfCurrentMonth = endOfMonth(targetDate);

  // Get monthly stats
  const { data: monthlyExpenses, error: monthlyError } = await supabaseAdmin
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', format(startOfCurrentMonth, 'yyyy-MM-dd'))
    .lte('expense_date', format(endOfCurrentMonth, 'yyyy-MM-dd'));

  if (monthlyError) throw new Error('Failed to fetch monthly expenses');

  // Calculate monthly stats
  const totalAmount = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const expenseCount = monthlyExpenses.length;
  const daysInMonth = endOfCurrentMonth.getDate();
  const avgDaily = expenseCount > 0 ? totalAmount / daysInMonth : 0;

  // Get categories count
  const { count: categoriesCount, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  if (categoriesError) throw new Error('Failed to fetch categories count');

  const monthlyStats: MonthlyStats = {
    total: totalAmount,
    expense_count: expenseCount,
    avg_daily: avgDaily,
    categories_count: categoriesCount || 0,
  };

  // Get recent expenses (last 5)
  const { data: recentExpensesData, error: recentError } = await supabaseAdmin
    .from('expenses')
    .select(
      `
      id,
      amount,
      description,
      expense_date,
      categories (
        id,
        name,
        icon
      )
    `
    )
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .limit(5);

  if (recentError) throw new Error('Failed to fetch recent expenses');

  const recentExpenses: RecentExpense[] = recentExpensesData.map((expense) => ({
    id: expense.id,
    amount: Number(expense.amount),
    description: expense.description,
    category: expense.categories[0]?.id || '',
    category_name: expense.categories[0]?.name || 'Other',
    category_icon: expense.categories[0]?.icon || 'card-outline',
    date: expense.expense_date,
  }));

  // Get calendar data for current month
  const { data: calendarExpensesData, error: calendarError } = await supabaseAdmin
    .from('expenses')
    .select(
      `
      id,
      amount,
      description,
      expense_date,
      categories (
        name,
        icon
      )
    `
    )
    .eq('user_id', userId)
    .gte('expense_date', format(startOfCurrentMonth, 'yyyy-MM-dd'))
    .lte('expense_date', format(endOfCurrentMonth, 'yyyy-MM-dd'))
    .order('expense_date', { ascending: false });

  if (calendarError) throw new Error('Failed to fetch calendar expenses');

  // Group expenses by date
  const calendarData: CalendarData = {};
  calendarExpensesData.forEach((expense) => {
    const date = expense.expense_date;
    if (!calendarData[date]) {
      calendarData[date] = [];
    }
    calendarData[date].push({
      id: expense.id,
      amount: Number(expense.amount),
      description: expense.description,
      category_name: expense.categories[0]?.name || 'Other',
      category_icon: expense.categories[0]?.icon || 'card-outline',
    });
  });

  return {
    monthly_stats: monthlyStats,
    recent_expenses: recentExpenses,
    calendar_data: calendarData,
  };
};

// Get expenses screen data (filtered, paginated expenses + categories)
export const getExpensesDataService = async (
  userId: string,
  query: ExpensesQueryData
): Promise<ExpensesScreenData> => {
  const { page, limit, search, category, start_date, end_date, sort_by, sort_order } = query;
  const offset = (page - 1) * limit;

  console.log('query', JSON.stringify(query, null, 2));

  // Build query with filters
  let expensesQuery = supabaseAdmin
    .from('expenses')
    .select(
      `
      id,
      amount,
      description,
      expense_date,
      notes,
      receipt_image_url,
      category_id,
      categories!category_id (
        id,
        name,
        icon,
        color
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId);

  // Apply filters
  if (search && search !== '' && search !== 'undefined') {
    expensesQuery = expensesQuery.ilike('description', `%${search}%`);
  }

  if (category && category !== '' && category !== 'undefined') {
    expensesQuery = expensesQuery.eq('category_id', category);
  }

  if (start_date) {
    expensesQuery = expensesQuery.gte('expense_date', start_date);
  }

  if (end_date) {
    expensesQuery = expensesQuery.lte('expense_date', end_date);
  }

  // Apply sorting
  const sortColumn = sort_by === 'amount' ? 'amount' : 'expense_date';
  expensesQuery = expensesQuery.order(sortColumn, { ascending: sort_order === 'asc' });

  // Apply pagination
  expensesQuery = expensesQuery.range(offset, offset + limit - 1);

  const { data: expensesData, error: expensesError, count: totalCount } = await expensesQuery;

  if (expensesError) throw new Error(expensesError.message || 'Failed to fetch expenses');

  // Get all categories for filter dropdown
  const { data: categoriesData, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select('id, name, icon, color')
    .eq('user_id', userId)
    .order('name');

  if (categoriesError) throw new Error(categoriesError.message || 'Failed to fetch categories');

  const expenses: ExpenseWithCategory[] = expensesData.map((expense: any) => ({
    id: expense.id,
    user_id: userId,
    amount: Number(expense.amount),
    description: expense.description,
    category_id: expense.categories?.id || null,
    expense_date: expense.expense_date,
    notes: expense.notes,
    receipt_image_url: expense.receipt_image_url,
    created_at: '',
    updated_at: '',
    category_name: expense.categories?.name,
    category_icon: expense.categories?.icon,
    category_color: expense.categories?.color,
  }));

  console.log('expenses', JSON.stringify(expenses, null, 2));

  // Calculate summary
  const filteredTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Pagination info
  const totalPages = Math.ceil((totalCount || 0) / limit);
  const hasMore = page < totalPages;

  return {
    expenses,
    categories: categoriesData as Category[],
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: totalCount || 0,
      has_more: hasMore,
    },
    summary: {
      total_expenses: totalCount || 0,
      filtered_total: filteredTotal,
    },
  };
};

// Get analytics data
export const getAnalyticsDataService = async (
  userId: string,
  query: AnalyticsQueryData
): Promise<AnalyticsData> => {
  const { period } = query;
  const currentDate = new Date();

  // Calculate date ranges based on period
  let startDate: Date;
  let endDate: Date = endOfMonth(currentDate);

  switch (period) {
    case 'week':
      startDate = addDays(currentDate, -7);
      endDate = currentDate;
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      break;
    case 'month':
    default:
      startDate = startOfMonth(currentDate);
  }

  // Get current period expenses
  const { data: currentExpenses, error: currentError } = await supabaseAdmin
    .from('expenses')
    .select('amount, expense_date, category_id, categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
    .lte('expense_date', format(endDate, 'yyyy-MM-dd'));

  console.log('error', JSON.stringify(currentError, null, 2));

  if (currentError) throw new Error('Failed to fetch current period expenses');

  // Get previous period for comparison
  const prevStartDate =
    period === 'month'
      ? startOfMonth(subMonths(currentDate, 1))
      : period === 'week'
        ? addDays(startDate, -7)
        : new Date(currentDate.getFullYear() - 1, 0, 1);

  const prevEndDate =
    period === 'month'
      ? endOfMonth(subMonths(currentDate, 1))
      : period === 'week'
        ? addDays(endDate, -7)
        : new Date(currentDate.getFullYear() - 1, 11, 31);

  const { data: prevExpenses, error: prevError } = await supabaseAdmin
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', format(prevStartDate, 'yyyy-MM-dd'))
    .lte('expense_date', format(prevEndDate, 'yyyy-MM-dd'));

  if (prevError) throw new Error('Failed to fetch previous period expenses');

  // Calculate totals
  const currentTotal = currentExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const prevTotal = prevExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const change = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
  const changeStr = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;

  // Calculate avg daily
  const daysInPeriod =
    period === 'week' ? 7 : period === 'month' ? endOfMonth(currentDate).getDate() : 365;
  const avgDaily = currentTotal / daysInPeriod;

  // Get categories
  const { data: categories, error: catError } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('user_id', userId);

  if (catError) throw new Error('Failed to fetch categories');

  // Calculate category breakdown
  const categoryMap = new Map();
  categories.forEach((cat) => categoryMap.set(cat.id, cat.name));

  const categoryTotals = new Map();
  currentExpenses.forEach((expense) => {
    const categoryName = expense.categories[0]?.name || 'Other';
    const current = categoryTotals.get(categoryName) || 0;
    categoryTotals.set(categoryName, current + Number(expense.amount));
  });

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([name, amount]) => {
      const category = categories.find((c) => c.name === name);
      return {
        category_id: category?.id || '',
        category_name: name,
        category_icon: 'card-outline',
        category_color: '#FFFFFF',
        amount: Number(amount),
        percentage: currentTotal > 0 ? (Number(amount) / currentTotal) * 100 : 0,
        expense_count: currentExpenses.filter((e) => e.categories[0]?.name === name).length,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category_name : 'None';

  return {
    period,
    summary: {
      this_month: { total: currentTotal, change: changeStr },
      avg_daily: { amount: avgDaily, change: changeStr },
      total_categories: categories.length,
      total_transactions: currentExpenses.length,
      top_category: topCategory,
    },
    spending_trends: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [120, 180, 95, 230], // Placeholder - would need more complex calculation
    },
    category_breakdown: categoryBreakdown,
    monthly_comparison: {
      labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      data: [450, 380, 520, 310, 480], // Placeholder - would need historical data
    },
  };
};

// Get settings data
export const getCategories = async (userId: string): Promise<GetCategories> => {
  // Get categories with expense counts
  const { data: categoriesData, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select(
      `
      *
    `
    )
    .eq('user_id', userId)
    .order('name');

  if (categoriesError) throw new Error('Failed to fetch categories');

  return {
    categories: categoriesData,
  };
};

// Process receipt image (placeholder - would integrate with OpenAI Vision)
export const processReceiptImageService = async (
  userId: string,
  imageBase64: string
): Promise<ProcessReceiptResponse> => {
  // This is a placeholder implementation
  // In production, this would:
  // 1. Decode the base64 image
  // 2. Send to OpenAI Vision API
  // 3. Parse the response
  // 4. Return structured data

  // Get user categories for the response
  const { data } = await supabaseAdmin
    .from('categories')
    .select('id, name, icon, color')
    .eq('user_id', userId)
    .order('name');

  // Mock AI response
  return {
    receipt_image_url: imageBase64,
    receipt_text: 'Sample receipt text',
  };
};
