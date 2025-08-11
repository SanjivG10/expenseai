import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AddExpenseScreen from './AddExpenseScreen';
import { apiService } from '../services/api';
import { ExpensesScreenData, ExpenseWithCategory, Category, ExpensesScreenQuery } from '../types';
import LoadingScreen, { InlineLoader } from '../components/LoadingScreen';

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function ExpensesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Debounce the search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // API state
  const [expensesData, setExpensesData] = useState<ExpensesScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const categoryOptions = expensesData
    ? [
        { id: null, name: 'All' },
        ...expensesData.categories.map((cat) => ({ id: cat.id, name: cat.name })),
      ]
    : [{ id: null, name: 'All' }];

  // Fetch expenses data from API
  const fetchExpensesData = async (isRefresh = false, page = 1) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        setCurrentPage(1);
      } else if (page > 1) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const query: ExpensesScreenQuery = {
        page,
        limit: 20,
        search: debouncedSearchQuery || undefined,
        category: filterCategory || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
      };

      const response = await apiService.getExpensesData(query);

      if (response.success && response.data) {
        if (isRefresh || page === 1) {
          setExpensesData(response.data);
        } else {
          // Append to existing data for pagination
          setExpensesData((prev) =>
            prev && response.data
              ? {
                  ...response.data,
                  expenses: [...prev.expenses, ...response.data.expenses],
                }
              : response.data || null
          );
        }
        setCurrentPage(page);
      } else {
        Alert.alert('Error', response.message || 'Failed to load expenses');
      }
    } catch (error) {
      console.error('Expenses fetch error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchExpensesData();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchExpensesData(true);
    }
  }, [debouncedSearchQuery, filterCategory, sortBy]);

  const handleEditExpense = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = async (expense: ExpenseWithCategory) => {
    Alert.alert('Delete Expense', `Are you sure you want to delete "${expense.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteExpense(expense.id);
            fetchExpensesData(true); // Refresh the list
            Alert.alert('Success', 'Expense deleted successfully');
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const handleUpdateExpense = () => {
    // Expense has been updated, refresh the list and clean up UI
    fetchExpensesData(true);
    setEditingExpense(null);
    setShowEditModal(false);
    // The AddExpenseScreen already shows success toast
  };

  const handleLoadMore = () => {
    if (expensesData?.pagination.has_more && !isLoadingMore) {
      fetchExpensesData(false, currentPage + 1);
    }
  };

  const handleRefresh = () => {
    fetchExpensesData(true);
  };

  // Loading state
  if (isLoading && !expensesData) {
    return <LoadingScreen message="Loading your expenses..." />;
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Expenses</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {expensesData?.summary.total_expenses || 0} transactions
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mx-6 mt-4">
        <View className="flex-row items-center rounded-lg border border-border bg-input px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#a3a3a3" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search expenses..."
            placeholderTextColor="#a3a3a3"
            className="ml-3 flex-1 text-foreground"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#a3a3a3" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter & Sort */}
      <View className="mx-6 mt-4">
        {/* Categories Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {categoryOptions.map((category) => (
              <TouchableOpacity
                key={category.id || 'all'}
                onPress={() => setFilterCategory(category.id)}
                className={`rounded-full border px-4 py-2 ${
                  filterCategory === category.id
                    ? 'border-primary bg-primary'
                    : 'border-border bg-secondary'
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    filterCategory === category.id ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sort Options */}
        <View className="flex-row gap-2">
          {[
            { key: 'date', label: 'Date', icon: 'calendar-outline' },
            { key: 'amount', label: 'Amount', icon: 'trending-down-outline' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setSortBy(option.key as 'date' | 'amount' | 'category')}
              className={`flex-row items-center rounded-lg border px-3 py-2 ${
                sortBy === option.key ? 'border-accent bg-accent' : 'border-border bg-secondary'
              }`}>
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={sortBy === option.key ? '#FFFFFF' : '#a3a3a3'}
              />
              <Text
                className={`ml-2 text-sm ${
                  sortBy === option.key ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Expenses List */}
      <ScrollView
        className="mt-4 flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom && !isLoadingMore) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}>
        {expensesData?.expenses.map((expense) => (
          <View
            key={expense.id}
            className="mb-3 overflow-hidden rounded-lg border border-border bg-secondary">
            <View className="flex-row items-center p-4">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Ionicons
                  name={
                    (expense.category_icon || 'receipt-outline') as keyof typeof Ionicons.glyphMap
                  }
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{expense.description}</Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {expense.category_name || 'Uncategorized'} • {expense.expense_date}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-foreground">
                  ${expense.amount.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row border-t border-border">
              <TouchableOpacity
                onPress={() => handleEditExpense(expense)}
                className="flex-1 flex-row items-center justify-center border-r border-border py-3">
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text className="ml-2 text-sm font-medium text-foreground">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteExpense(expense)}
                className="flex-1 flex-row items-center justify-center py-3">
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text className="ml-2 text-sm font-medium text-red-500">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {expensesData && expensesData.expenses.length === 0 && (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={64} color="#404040" />
            <Text className="mt-4 text-lg text-muted-foreground">No expenses found</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}

        {/* Load More Indicator */}
        {isLoadingMore && (
          <InlineLoader size="small" message="Loading more expenses..." showDots={false} />
        )}

        {/* Bottom Spacing for Tab Bar */}
        <View className="h-10" />
      </ScrollView>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <AddExpenseScreen
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingExpense(null);
          }}
          onSave={handleUpdateExpense}
          initialData={editingExpense}
        />
      )}
    </View>
  );
}
