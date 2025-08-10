import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useExpenseStore, Expense } from '../store/expenseStore';
import { useNavigation } from '@react-navigation/native';
import AddExpenseScreen from './AddExpenseScreen';
import CalendarView from '../components/CalendarView';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const { expenses, addExpense, categories } = useExpenseStore();
  const navigation = useNavigation();

  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthName = format(new Date(), 'MMMM yyyy');

  const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(currentMonth));

  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const recentExpenses = expenses.slice(0, 3);

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || categoryId;
  };

  const handleCalendarDaySelect = () => {
    // Calendar day selection handled within CalendarView component
  };

  const handleViewAllExpenses = () => {
    // @ts-ignore - Navigate to Expenses tab
    navigation.navigate('Expenses');
  };

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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Calendar View */}
        {showCalendarView && (
          <View className="mx-6 mt-6">
            <CalendarView onDaySelect={handleCalendarDaySelect} />
          </View>
        )}
        {/* Monthly Overview Card */}
        {!showCalendarView && (
          <View className="mx-6 mt-6 rounded-lg border border-border bg-secondary p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">This Month</Text>
              <Ionicons name="trending-up-outline" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-foreground">${monthlyTotal.toFixed(2)}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">Total spent</Text>
          </View>
        )}
        {/* Quick Stats */}
        {!showCalendarView && (
          <View className="mx-6 mt-4 flex-row gap-3">
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Categories</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">{categories.length}</Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Transactions</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {monthlyExpenses.length}
              </Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-secondary p-4">
              <Text className="text-sm text-muted-foreground">Avg/Day</Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                ${monthlyExpenses.length > 0 ? (monthlyTotal / 10).toFixed(0) : '0'}
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

          {recentExpenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              className="mb-3 flex-row items-center rounded-lg border border-border bg-secondary p-4">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-foreground">{expense.description}</Text>
                <Text className="text-sm text-muted-foreground">
                  {getCategoryName(expense.category)} • {expense.date}
                </Text>
              </View>
              <Text className="font-bold text-foreground">${expense.amount.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!showCalendarView && (
          <View className="mx-6 mt-6">
            <Text className="mb-4 text-lg font-semibold text-foreground">Quick Actions</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => navigation.navigate('Camera' as never)}
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
        onSave={addExpense}
      />
    </View>
  );
}
