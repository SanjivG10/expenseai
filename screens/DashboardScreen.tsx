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
  const [selectedCalendarExpenses, setSelectedCalendarExpenses] = useState<Expense[]>([]);
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

  const handleCalendarDaySelect = (date: Date, dayExpenses: Expense[]) => {
    setSelectedCalendarExpenses(dayExpenses);
  };

  const handleViewAllExpenses = () => {
    // @ts-ignore - Navigate to Expenses tab
    navigation.navigate('Expenses');
  };

  return (
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-6 pt-14">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-foreground text-2xl font-bold">Dashboard</Text>
            <Text className="text-muted-foreground mt-1 text-sm">{currentMonthName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCalendarView(!showCalendarView)}
            className={`rounded-lg p-3 ${showCalendarView ? 'bg-primary' : 'bg-secondary border-border border'}`}>
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
          <View className="border-border bg-secondary mx-6 mt-6 rounded-lg border p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-foreground text-lg font-semibold">This Month</Text>
              <Ionicons name="trending-up-outline" size={24} color="#FFFFFF" />
            </View>
            <Text className="text-foreground text-3xl font-bold">${monthlyTotal.toFixed(2)}</Text>
            <Text className="text-muted-foreground mt-1 text-sm">Total spent</Text>
          </View>
        )}
        {/* Quick Stats */}
        {!showCalendarView && (
          <View className="mx-6 mt-4 flex-row gap-3">
            <View className="border-border bg-secondary flex-1 rounded-lg border p-4">
              <Text className="text-muted-foreground text-sm">Categories</Text>
              <Text className="text-foreground mt-1 text-xl font-bold">{categories.length}</Text>
            </View>
            <View className="border-border bg-secondary flex-1 rounded-lg border p-4">
              <Text className="text-muted-foreground text-sm">Transactions</Text>
              <Text className="text-foreground mt-1 text-xl font-bold">
                {monthlyExpenses.length}
              </Text>
            </View>
            <View className="border-border bg-secondary flex-1 rounded-lg border p-4">
              <Text className="text-muted-foreground text-sm">Avg/Day</Text>
              <Text className="text-foreground mt-1 text-xl font-bold">
                ${monthlyExpenses.length > 0 ? (monthlyTotal / 10).toFixed(0) : '0'}
              </Text>
            </View>
          </View>
        )}
        {/* Recent Expenses */}
        <View className="mx-6 mt-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-foreground text-lg font-semibold">Recent Expenses</Text>
            <TouchableOpacity onPress={handleViewAllExpenses}>
              <Text className="text-primary text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              className="border-border bg-secondary mb-3 flex-row items-center rounded-lg border p-4">
              <View className="bg-accent mr-3 h-10 w-10 items-center justify-center rounded-full">
                <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-medium">{expense.description}</Text>
                <Text className="text-muted-foreground text-sm">
                  {getCategoryName(expense.category)} • {expense.date}
                </Text>
              </View>
              <Text className="text-foreground font-bold">${expense.amount.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!showCalendarView && (
          <View className="mx-6 mt-6">
            <Text className="text-foreground mb-4 text-lg font-semibold">Quick Actions</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="bg-primary flex-1 items-center rounded-lg p-4">
                <Ionicons name="camera-outline" size={24} color="#000000" />
                <Text className="text-primary-foreground mt-2 font-medium">Scan Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAddExpense(true)}
                className="border-border bg-secondary flex-1 items-center rounded-lg border p-4">
                <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                <Text className="text-foreground mt-2 font-medium">Add Manual</Text>
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
