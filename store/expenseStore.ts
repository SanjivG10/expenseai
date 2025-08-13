import { create } from 'zustand';

export interface ExpenseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  image?: string;
  item_breakdowns?: ExpenseItem[];
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ExpenseStore {
  expenses: Expense[];
  categories: Category[];

  // Actions
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Getters
  getExpensesByMonth: (month: string) => Expense[];
  getExpensesByCategory: (categoryId: string) => Expense[];
  getTotalByMonth: (month: string) => number;
  getCategoryTotals: () => { [key: string]: number };
}

const defaultCategories: Category[] = [
  { id: 'food', name: 'Food & Drink', icon: 'restaurant-outline' },
  { id: 'transport', name: 'Transport', icon: 'car-outline' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline' },
  { id: 'entertainment', name: 'Entertainment', icon: 'play-circle-outline' },
  { id: 'groceries', name: 'Groceries', icon: 'basket-outline' },
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical-outline' },
  { id: 'other', name: 'Other', icon: 'card-outline' },
];

// Sample data for development
const sampleExpenses: Expense[] = [
  {
    id: '1',
    amount: 87.45,
    description: 'Whole Foods Market',
    category: 'groceries',
    date: '2025-01-10',
    timestamp: '2025-01-10T14:30:00Z',
  },
  {
    id: '2',
    amount: 42.3,
    description: 'Shell Gas Station',
    category: 'transport',
    date: '2025-01-10',
    timestamp: '2025-01-10T09:15:00Z',
  },
  {
    id: '3',
    amount: 6.75,
    description: 'Starbucks Coffee',
    category: 'food',
    date: '2025-01-09',
    timestamp: '2025-01-09T08:00:00Z',
  },
  {
    id: '4',
    amount: 15.99,
    description: 'Netflix Subscription',
    category: 'entertainment',
    date: '2025-01-09',
    timestamp: '2025-01-09T00:00:00Z',
  },
  {
    id: '5',
    amount: 124.99,
    description: 'Amazon Purchase',
    category: 'shopping',
    date: '2025-01-08',
    timestamp: '2025-01-08T15:45:00Z',
  },
];

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: sampleExpenses,
  categories: defaultCategories,

  addExpense: (expense) =>
    set((state) => ({
      expenses: [expense, ...state.expenses],
    })),

  updateExpense: (id, updatedExpense) =>
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      ),
    })),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== id),
    })),

  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  updateCategory: (id, updatedCategory) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id ? { ...category, ...updatedCategory } : category
      ),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
      expenses: state.expenses.map((expense) =>
        expense.category === id ? { ...expense, category: 'other' } : expense
      ),
    })),

  getExpensesByMonth: (month) => {
    const expenses = get().expenses;
    return expenses.filter((expense) => expense.date.startsWith(month));
  },

  getExpensesByCategory: (categoryId) => {
    const expenses = get().expenses;
    return expenses.filter((expense) => expense.category === categoryId);
  },

  getTotalByMonth: (month) => {
    const monthlyExpenses = get().getExpensesByMonth(month);
    return monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  },

  getCategoryTotals: () => {
    const expenses = get().expenses;
    const totals: { [key: string]: number } = {};

    expenses.forEach((expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });

    return totals;
  },
}));
