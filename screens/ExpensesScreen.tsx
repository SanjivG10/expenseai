import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AddExpenseScreen from './AddExpenseScreen';
import { apiService } from '../services/api';
import { ExpensesResponse, ExpenseWithCategory, Category, ExpensesQuery } from '../types/api';
import LoadingScreen, { InlineLoader } from '../components/LoadingScreen';

export default function ExpensesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // API state
  const [expensesData, setExpensesData] = useState<ExpensesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const categoryOptions = expensesData 
    ? ['All', ...expensesData.categories.map((cat) => cat.name)]
    : ['All'];

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

      const query: ExpensesQuery = {
        page,
        limit: 20,
        search: searchQuery || undefined,
        category: filterCategory || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const response = await apiService.getExpensesData(query);
      
      if (response.success) {
        if (isRefresh || page === 1) {
          setExpensesData(response.data);
        } else {
          // Append to existing data for pagination
          setExpensesData(prev => prev ? {
            ...response.data,
            expenses: [...prev.expenses, ...response.data.expenses]
          } : response.data);
        }
        setCurrentPage(page);
      } else {
        Alert.alert('Error', response.message || 'Failed to load expenses');
      }
    } catch (error) {
      console.error('Expenses fetch error:', error);
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
  }, [searchQuery, filterCategory, sortBy, sortOrder]);

  const getCategoryIcon = (categoryId: string) => {
    if (!expensesData) return 'receipt-outline';
    const category = expensesData.categories.find((cat) => cat.id === categoryId);
    return category?.icon || 'receipt-outline';
  };

  const getCategoryName = (categoryId: string) => {
    if (!expensesData) return categoryId;
    const category = expensesData.categories.find((cat) => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const handleEditExpense = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = async (expense: ExpenseWithCategory) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
      [
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
          }
        }
      ]
    );
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
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-4 pt-14">
        <Text className="text-foreground text-2xl font-bold">Expenses</Text>
        <Text className="text-muted-foreground mt-1 text-sm">
          {expensesData?.summary.total_expenses || 0} transactions
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mx-6 mt-4">
        <View className="border-border bg-input flex-row items-center rounded-lg border px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#a3a3a3" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search expenses..."
            placeholderTextColor="#a3a3a3"
            className="text-foreground ml-3 flex-1"
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
                key={category}
                onPress={() => setFilterCategory(category === 'All' ? null : category)}
                className={`rounded-full border px-4 py-2 ${
                  filterCategory === category || (filterCategory === null && category === 'All')
                    ? 'border-primary bg-primary'
                    : 'border-border bg-secondary'
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    filterCategory === category || (filterCategory === null && category === 'All')
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}>
                  {category}
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
            { key: 'category', label: 'Category', icon: 'list-outline' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setSortBy(option.key as any)}
              className={`flex-row items-center rounded-lg border px-3 py-2 ${
                sortBy === option.key ? 'border-accent bg-accent' : 'border-border bg-secondary'
              }`}>
              <Ionicons
                name={option.icon as any}
                size={16}
                color={sortBy === option.key ? '#FFFFFF' : '#a3a3a3'}
              />
              <Text
                className={`ml-2 text-sm ${
                  sortBy === option.key ? 'text-foreground font-medium' : 'text-muted-foreground'
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
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom && !isLoadingMore) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}>
        {expensesData?.expenses.map((expense) => (
          <View
            key={expense.id}
            className="border-border bg-secondary mb-3 rounded-lg border overflow-hidden">
            <View className="flex-row items-center p-4">
              <View className="bg-accent mr-4 h-12 w-12 items-center justify-center rounded-full">
                <Ionicons name={(expense.category_icon || 'receipt-outline') as any} size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{expense.description}</Text>
                <Text className="text-muted-foreground mt-1 text-sm">
                  {expense.category_name || 'Uncategorized'} • {expense.expense_date}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground text-lg font-bold">
                  ${expense.amount.toFixed(2)}
                </Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row border-t border-border">
              <TouchableOpacity
                onPress={() => handleEditExpense(expense)}
                className="flex-1 flex-row items-center justify-center py-3 border-r border-border">
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text className="ml-2 text-sm text-foreground font-medium">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteExpense(expense)}
                className="flex-1 flex-row items-center justify-center py-3">
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text className="ml-2 text-sm text-red-500 font-medium">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {expensesData && expensesData.expenses.length === 0 && (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={64} color="#404040" />
            <Text className="text-muted-foreground mt-4 text-lg">No expenses found</Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm">
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
