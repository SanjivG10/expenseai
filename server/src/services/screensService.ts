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

  // Get user preferences for budget information
  const { data: userPrefs, error: prefsError } = await supabaseAdmin
    .from('user_preferences')
    .select('daily_budget, weekly_budget, monthly_budget')
    .eq('user_id', userId)
    .single();

  let budgetData = null;
  if (userPrefs && !prefsError) {
    budgetData = {
      daily_budget: userPrefs.daily_budget,
      weekly_budget: userPrefs.weekly_budget,
      monthly_budget: userPrefs.monthly_budget,
    };
  }

  // Get monthly stats
  const { data: monthlyExpenses, error: monthlyError } = await supabaseAdmin
    .from('expenses')
    .select('amount, expense_date')
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
      category_id,
      categories!category_id (
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

  const recentExpenses: RecentExpense[] = recentExpensesData.map((expense: any) => ({
    id: expense.id,
    amount: Number(expense.amount),
    description: expense.description,
    category: expense.category_id || '',
    category_name: expense.categories?.name || 'Other',
    category_icon: expense.categories?.icon || 'card-outline',
    date: expense.expense_date,
  }));

  console.log(JSON.stringify(recentExpenses, null, 2));

  // Get calendar data for current month
  const { data: calendarExpensesData, error: calendarError } = await supabaseAdmin
    .from('expenses')
    .select(
      `
      id,
      amount,
      description,
      expense_date,
      category_id,
      categories!category_id (
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
  calendarExpensesData.forEach((expense: any) => {
    const date = expense.expense_date;
    if (!calendarData[date]) {
      calendarData[date] = [];
    }
    calendarData[date].push({
      id: expense.id,
      amount: Number(expense.amount),
      description: expense.description,
      category_name: expense.categories?.name || 'Other',
      category_icon: expense.categories?.icon || 'card-outline',
    });
  });

  // Calculate budget progress if budgets exist
  let budgetProgress = null;
  if (budgetData) {
    const currentDate = new Date();
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');

    // Calculate daily spending (today only)
    const todayExpenses = monthlyExpenses.filter((exp) => exp.expense_date === currentDateStr);
    const dailySpent = todayExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Calculate weekly spending (current week)
    const weekStart = format(addDays(currentDate, -currentDate.getDay()), 'yyyy-MM-dd');
    const weekExpenses = monthlyExpenses.filter((exp) => exp.expense_date >= weekStart);
    const weeklySpent = weekExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Monthly spending is already calculated above
    const monthlySpent = totalAmount;

    budgetProgress = {
      daily: budgetData.daily_budget
        ? {
            budget: budgetData.daily_budget,
            spent: dailySpent,
            remaining: Math.max(0, budgetData.daily_budget - dailySpent),
            percentage: Math.min(100, Math.round((dailySpent / budgetData.daily_budget) * 100)),
          }
        : null,
      weekly: budgetData.weekly_budget
        ? {
            budget: budgetData.weekly_budget,
            spent: weeklySpent,
            remaining: Math.max(0, budgetData.weekly_budget - weeklySpent),
            percentage: Math.min(100, Math.round((weeklySpent / budgetData.weekly_budget) * 100)),
          }
        : null,
      monthly: budgetData.monthly_budget
        ? {
            budget: budgetData.monthly_budget,
            spent: monthlySpent,
            remaining: Math.max(0, budgetData.monthly_budget - monthlySpent),
            percentage: Math.min(100, Math.round((monthlySpent / budgetData.monthly_budget) * 100)),
          }
        : null,
    };
  }

  return {
    monthly_stats: monthlyStats,
    recent_expenses: recentExpenses,
    calendar_data: calendarData,
    budget_progress: budgetProgress,
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
  let endDate: Date = currentDate;
  let periodLabel: string;

  switch (period) {
    case 'week':
      // Last 7 days including today
      startDate = addDays(currentDate, -6);
      endDate = currentDate;
      periodLabel = 'This Week';
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      periodLabel = 'This Year';
      break;
    case 'month':
    default:
      startDate = startOfMonth(currentDate);
      periodLabel = 'This Month';
  }

  // Get current period expenses
  const { data: currentExpenses, error: currentError } = await supabaseAdmin
    .from('expenses')
    .select(
      `
      amount,
      expense_date,
      category_id,
      categories!category_id (
        id,
        name,
        icon,
        color
      )
    `
    )
    .eq('user_id', userId)
    .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
    .lte('expense_date', format(endDate, 'yyyy-MM-dd'));

  if (currentError)
    throw new Error(currentError.message || 'Failed to fetch current period expenses');

  // Get previous period for comparison
  let prevStartDate: Date;
  let prevEndDate: Date;

  switch (period) {
    case 'week':
      prevStartDate = addDays(startDate, -7);
      prevEndDate = addDays(endDate, -7);
      break;
    case 'month':
      prevStartDate = startOfMonth(subMonths(currentDate, 1));
      prevEndDate = endOfMonth(subMonths(currentDate, 1));
      break;
    case 'year':
      prevStartDate = new Date(currentDate.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(currentDate.getFullYear() - 1, 11, 31);
      break;
  }

  const { data: prevExpenses, error: prevError } = await supabaseAdmin
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', format(prevStartDate, 'yyyy-MM-dd'))
    .lte('expense_date', format(prevEndDate, 'yyyy-MM-dd'));

  if (prevError) throw new Error(prevError.message || 'Failed to fetch previous period expenses');

  // Calculate totals
  const currentTotal = currentExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const prevTotal = prevExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const change = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
  const changeStr = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;

  // Calculate avg daily
  const daysInPeriod =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const avgDaily = currentTotal / daysInPeriod;

  // Get categories
  const { data: categories, error: catError } = await supabaseAdmin
    .from('categories')
    .select('id, name, icon, color')
    .eq('user_id', userId);

  if (catError) throw new Error('Failed to fetch categories');

  // Calculate category breakdown
  const categoryTotals = new Map();
  currentExpenses.forEach((expense: any) => {
    const categoryId = expense.categories?.id || null;
    const categoryName = expense.categories?.name || 'Other';
    const key = categoryId;
    const current = categoryTotals.get(key) || {
      amount: 0,
      name: categoryName,
      id: categoryId,
      count: 0,
    };
    current.amount += Number(expense.amount);
    current.count += 1;
    categoryTotals.set(key, current);
  });

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([key, data]) => {
      const category = categories.find((c) => c.id === data.id);
      return {
        category_id: data.id || '',
        category_name: data.name,
        category_icon: category?.icon || 'card-outline',
        category_color: category?.color || '#FFFFFF',
        amount: Number(data.amount),
        percentage: currentTotal > 0 ? (Number(data.amount) / currentTotal) * 100 : 0,
        expense_count: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category_name : 'None';

  // Generate spending trends data based on period
  let spendingTrends: { labels: string[]; data: number[] };

  switch (period) {
    case 'week':
      // Daily breakdown for the week
      const weekLabels = [];
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = addDays(currentDate, -i);
        weekLabels.push(format(date, 'EEE'));

        const dayExpenses = currentExpenses.filter(
          (exp) => exp.expense_date === format(date, 'yyyy-MM-dd')
        );
        const dayTotal = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        weekData.push(dayTotal);
      }
      spendingTrends = { labels: weekLabels, data: weekData };
      break;

    case 'month':
      // Weekly breakdown for the month
      const monthLabels = [];
      const monthData = [];
      const weeksInMonth = Math.ceil(endOfMonth(currentDate).getDate() / 7);

      for (let week = 1; week <= weeksInMonth; week++) {
        monthLabels.push(`Week ${week}`);

        const weekStart = addDays(startOfMonth(currentDate), (week - 1) * 7);
        const weekEnd = week === weeksInMonth ? endOfMonth(currentDate) : addDays(weekStart, 6);

        const weekExpenses = currentExpenses.filter((exp) => {
          const expDate = new Date(exp.expense_date);
          return expDate >= weekStart && expDate <= weekEnd;
        });

        const weekTotal = weekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        monthData.push(weekTotal);
      }
      spendingTrends = { labels: monthLabels, data: monthData };
      break;

    case 'year':
      // Monthly breakdown for the year
      const yearLabels = [];
      const yearData = [];

      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(currentDate.getFullYear(), month, 1);
        yearLabels.push(format(monthDate, 'MMM'));

        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthExpenses = currentExpenses.filter((exp) => {
          const expDate = new Date(exp.expense_date);
          return expDate >= monthStart && expDate <= monthEnd;
        });

        const monthTotal = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        yearData.push(monthTotal);
      }
      spendingTrends = { labels: yearLabels, data: yearData };
      break;
  }

  // Generate comparison data based on period
  let comparisonData: { labels: string[]; data: number[] };

  switch (period) {
    case 'week':
      // Compare with previous 4 weeks
      const compWeekLabels = [];
      const compWeekData = [];

      for (let i = 3; i >= 0; i--) {
        const weekStart = addDays(currentDate, -(i * 7 + 6));
        const weekEnd = addDays(currentDate, -(i * 7));

        // Use day names for weekly comparison
        compWeekLabels.push(format(weekStart, 'EEE'));

        // Get expenses for this week
        const { data: weekExpenses, error: weekError } = await supabaseAdmin
          .from('expenses')
          .select('amount')
          .eq('user_id', userId)
          .gte('expense_date', format(weekStart, 'yyyy-MM-dd'))
          .lte('expense_date', format(weekEnd, 'yyyy-MM-dd'));

        if (weekError) {
          console.error('Error fetching week data:', weekError);
          compWeekData.push(0);
        } else {
          const weekTotal = weekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          compWeekData.push(weekTotal);
        }
      }

      comparisonData = { labels: compWeekLabels, data: compWeekData };
      break;

    case 'month':
      // Compare with previous 6 months
      const compMonthLabels = [];
      const compMonthData = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Use short month names for monthly comparison
        compMonthLabels.push(format(monthDate, 'MMM'));

        // Get expenses for this month
        const { data: monthExpenses, error: monthError } = await supabaseAdmin
          .from('expenses')
          .select('amount')
          .eq('user_id', userId)
          .gte('expense_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('expense_date', format(monthEnd, 'yyyy-MM-dd'));

        if (monthError) {
          console.error('Error fetching month data:', monthError);
          compMonthData.push(0);
        } else {
          const monthTotal = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          compMonthData.push(monthTotal);
        }
      }

      comparisonData = { labels: compMonthLabels, data: compMonthData };
      break;

    case 'year':
      // Compare with previous 3 years
      const compYearLabels = [];
      const compYearData = [];

      for (let i = 2; i >= 0; i--) {
        const yearDate = new Date(currentDate.getFullYear() - i, 0, 1);
        const yearStart = new Date(yearDate.getFullYear(), 0, 1);
        const yearEnd = new Date(yearDate.getFullYear(), 11, 31);

        // Use year for yearly comparison
        compYearLabels.push(yearDate.getFullYear().toString());

        // Get expenses for this year
        const { data: yearExpenses, error: yearError } = await supabaseAdmin
          .from('expenses')
          .select('amount')
          .eq('user_id', userId)
          .gte('expense_date', format(yearStart, 'yyyy-MM-dd'))
          .lte('expense_date', format(yearEnd, 'yyyy-MM-dd'));

        if (yearError) {
          console.error('Error fetching year data:', yearError);
          compYearData.push(0);
        } else {
          const yearTotal = yearExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          compYearData.push(yearTotal);
        }
      }

      comparisonData = { labels: compYearLabels, data: compYearData };
      break;
  }

  const result = {
    period,
    summary: {
      this_month: { total: currentTotal, change: changeStr },
      avg_daily: { amount: avgDaily, change: changeStr },
      total_categories: categories.length,
      total_transactions: currentExpenses.length,
      top_category: topCategory,
    },
    spending_trends: spendingTrends,
    category_breakdown: categoryBreakdown,
    monthly_comparison: comparisonData,
  };

  return result;
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
