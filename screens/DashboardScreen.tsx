import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalendarView from '../components/CalendarView';
import LoadingScreen from '../components/LoadingScreen';
import { ROUTES } from '../constants/urls';
import { apiService } from '../services/api';
import { DashboardScreenQuery, DashboardScreenResponse } from '../types';
import AddExpenseScreen from './AddExpenseScreen';

export default function DashboardScreen() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardScreenResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigation = useNavigation();

  console.log({ dashboardData: JSON.stringify(dashboardData, null, 2) });

  const currentMonthName = format(selectedDate, 'MMMM yyyy');

  // Fetch dashboard data from API
  const fetchDashboardData = async (isRefresh = false, targetDate?: Date) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const dateToUse = targetDate || selectedDate;
      const query: DashboardScreenQuery = {
        month: dateToUse.getMonth() + 1, // Convert 0-11 to 1-12
        year: dateToUse.getFullYear(),
      };

      const response = await apiService.getDashboardData(query);

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleCalendarDaySelect = (date: Date) => {
    setSelectedDate(date);
    // Data will be fetched automatically due to useEffect dependency
  };

  const handleMonthChange = (date: Date) => {
    setSelectedDate(date);
    // Data will be fetched automatically due to useEffect dependency
  };

  const handleViewAllExpenses = () => {
    // @ts-ignore - Navigate to Expenses tab
    navigation.navigate(ROUTES.EXPENSES as never);
  };

  const handleAddExpense = () => {
    // After adding expense, refresh dashboard data
    fetchDashboardData(true);
  };

  // Loading state
  if (isLoading && !dashboardData) {
    return <LoadingScreen message="Loading your dashboard..." />;
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
            <CalendarView
              onDaySelect={handleCalendarDaySelect}
              onMonthChange={handleMonthChange}
              calendarData={dashboardData?.calendar_data || {}}
              selectedDate={selectedDate}
            />
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
              ${dashboardData.monthly_stats.total.toFixed(2)}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">Total spent</Text>
          </View>
        )}

        {/* Budget Indicators */}
        {!showCalendarView && dashboardData?.budget_progress && (
          <View className="mx-6 mt-6">
            <Text className="mb-4 text-lg font-semibold text-foreground">Budget Progress</Text>
            <View className="gap-3">
              {/* Daily Budget */}
              {dashboardData.budget_progress.daily && (
                <View className="rounded-lg border border-border bg-secondary p-4">
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Ionicons name="today-outline" size={16} color="#FFFFFF" />
                      </View>
                      <Text className="font-medium text-foreground">Daily Budget</Text>
                    </View>
                    <Text className="text-sm font-medium text-muted-foreground">
                      {dashboardData.budget_progress.daily.percentage}%
                    </Text>
                  </View>
                  
                  {/* Progress Bar */}
                  <View className="mb-2 h-2 rounded-full bg-border overflow-hidden">
                    <View 
                      className={`h-full rounded-full ${
                        dashboardData.budget_progress.daily.percentage >= 100 
                          ? 'bg-red-500' 
                          : dashboardData.budget_progress.daily.percentage >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, dashboardData.budget_progress.daily.percentage)}%` }}
                    />
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">
                      ${dashboardData.budget_progress.daily.spent.toFixed(2)} spent
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      ${dashboardData.budget_progress.daily.remaining.toFixed(2)} left
                    </Text>
                  </View>
                </View>
              )}

              {/* Weekly Budget */}
              {dashboardData.budget_progress.weekly && (
                <View className="rounded-lg border border-border bg-secondary p-4">
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                      </View>
                      <Text className="font-medium text-foreground">Weekly Budget</Text>
                    </View>
                    <Text className="text-sm font-medium text-muted-foreground">
                      {dashboardData.budget_progress.weekly.percentage}%
                    </Text>
                  </View>
                  
                  {/* Progress Bar */}
                  <View className="mb-2 h-2 rounded-full bg-border overflow-hidden">
                    <View 
                      className={`h-full rounded-full ${
                        dashboardData.budget_progress.weekly.percentage >= 100 
                          ? 'bg-red-500' 
                          : dashboardData.budget_progress.weekly.percentage >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, dashboardData.budget_progress.weekly.percentage)}%` }}
                    />
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">
                      ${dashboardData.budget_progress.weekly.spent.toFixed(2)} spent
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      ${dashboardData.budget_progress.weekly.remaining.toFixed(2)} left
                    </Text>
                  </View>
                </View>
              )}

              {/* Monthly Budget */}
              {dashboardData.budget_progress.monthly && (
                <View className="rounded-lg border border-border bg-secondary p-4">
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Ionicons name="trending-up-outline" size={16} color="#FFFFFF" />
                      </View>
                      <Text className="font-medium text-foreground">Monthly Budget</Text>
                    </View>
                    <Text className="text-sm font-medium text-muted-foreground">
                      {dashboardData.budget_progress.monthly.percentage}%
                    </Text>
                  </View>
                  
                  {/* Progress Bar */}
                  <View className="mb-2 h-2 rounded-full bg-border overflow-hidden">
                    <View 
                      className={`h-full rounded-full ${
                        dashboardData.budget_progress.monthly.percentage >= 100 
                          ? 'bg-red-500' 
                          : dashboardData.budget_progress.monthly.percentage >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, dashboardData.budget_progress.monthly.percentage)}%` }}
                    />
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">
                      ${dashboardData.budget_progress.monthly.spent.toFixed(2)} spent
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      ${dashboardData.budget_progress.monthly.remaining.toFixed(2)} left
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        {!showCalendarView && dashboardData && (
          <View className="mx-6 mt-4 flex-row gap-3">
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Categories</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {dashboardData.monthly_stats.categories_count}
              </Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Transactions</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {dashboardData.monthly_stats.expense_count}
              </Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Avg/Day</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                ${dashboardData.monthly_stats.avg_daily.toFixed(0)}
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

          {dashboardData && dashboardData.recent_expenses.length > 0 ? (
            dashboardData.recent_expenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                className="mb-3 flex-row items-center rounded-lg border border-border bg-secondary p-4">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <Ionicons name={expense.category_icon as any} size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-foreground">{expense.description}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {expense.category_name} • {expense.date}
                  </Text>
                </View>
                <Text className="font-bold text-foreground">${expense.amount.toFixed(2)}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center py-8">
              <Ionicons name="receipt-outline" size={48} color="#404040" />
              <Text className="mt-4 text-muted-foreground">No expenses yet</Text>
              <Text className="text-sm text-muted-foreground">
                Add your first expense to get started
              </Text>
            </View>
          )}
        </View>

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
