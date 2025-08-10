import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import AddExpenseScreen from './AddExpenseScreen';
import CalendarView from '../components/CalendarView';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import { DashboardResponse, Expense } from '../types/api';
import { ROUTES } from '../constants/urls';

export default function DashboardScreen() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation();

  const currentMonthName = format(new Date(), 'MMMM yyyy');

  // Fetch dashboard data from API
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiService.getDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleCalendarDaySelect = () => {
    // Calendar day selection handled within CalendarView component
  };

  const handleViewAllExpenses = () => {
    // @ts-ignore - Navigate to Expenses tab
    navigation.navigate(ROUTES.EXPENSES as never);
  };

  const handleAddExpense = (expense: any) => {
    // After adding expense, refresh dashboard data
    fetchDashboardData(true);
  };

  // Loading state
  if (isLoading && !dashboardData) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar style="light" backgroundColor="#000000" />
        <Ionicons name="refresh-outline" size={48} color="#404040" />
        <Text className="mt-4 text-lg text-muted-foreground">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-6 pt-14">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
            <Text className="mt-1 text-sm text-muted-foreground">{currentMonthName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCalendarView(!showCalendarView)}
            className={`rounded-lg p-3 ${showCalendarView ? 'bg-primary' : 'border border-border bg-secondary'}`}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={showCalendarView ? '#000000' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
          />
        }>
        {/* Calendar View */}
        {showCalendarView && (
          <View className="mx-6 mt-6">
            <CalendarView onDaySelect={handleCalendarDaySelect} />
          </View>
        )}
        {/* Monthly Overview Card */}
        {!showCalendarView && dashboardData && (
          <View className="mx-6 mt-6 rounded-lg border border-border bg-secondary p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">This Month</Text>
              <Ionicons name="trending-up-outline" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-foreground">
              ${dashboardData.monthlyStats.total.toFixed(2)}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">Total spent</Text>
          </View>
        )}
        {/* Quick Stats */}
        {!showCalendarView && dashboardData && (
          <View className="mx-6 mt-4 flex-row gap-3">
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Categories</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {dashboardData.monthlyStats.categoriesCount}
              </Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Transactions</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {dashboardData.monthlyStats.expenseCount}
              </Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Avg/Day</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                ${dashboardData.monthlyStats.avgDaily.toFixed(0)}
              </Text>
            </View>
          </View>
        )}
        {/* Recent Expenses */}
        <View className="mx-6 mt-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">Recent Expenses</Text>
            <TouchableOpacity onPress={handleViewAllExpenses}>
              <Text className="text-sm text-primary">View All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData && dashboardData.recentExpenses.length > 0 ? (
            dashboardData.recentExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                className="mb-3 flex-row items-center rounded-lg border border-border bg-secondary p-4">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-foreground">{expense.description}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {expense.categoryName} • {expense.date}
                  </Text>
                </View>
                <Text className="font-bold text-foreground">${expense.amount.toFixed(2)}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center py-8">
              <Ionicons name="receipt-outline" size={48} color="#404040" />
              <Text className="mt-4 text-muted-foreground">No expenses yet</Text>
              <Text className="text-sm text-muted-foreground">Add your first expense to get started</Text>
            </View>
          )}
        </View>

        {!showCalendarView && (
          <View className="mx-6 mt-6">
            <Text className="mb-4 text-lg font-semibold text-foreground">Quick Actions</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => navigation.navigate(ROUTES.CAMERA as never)}
                className="flex-1 items-center rounded-lg bg-primary p-4">
                <Ionicons name="camera-outline" size={24} color="#000000" />
                <Text className="mt-2 font-medium text-primary-foreground">Scan Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAddExpense(true)}
                className="flex-1 items-center rounded-lg border border-border bg-secondary p-4">
                <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                <Text className="mt-2 font-medium text-foreground">Add Manual</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Bottom Spacing for Tab Bar */}
        <View className="h-10" />
      </ScrollView>

      <AddExpenseScreen
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSave={handleAddExpense}
      />
    </View>
  );
}
