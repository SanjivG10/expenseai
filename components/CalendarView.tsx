import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { useExpenseStore, Expense } from '../store/expenseStore';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarViewProps {
  onDaySelect: (date: Date, expenses: Expense[]) => void;
}

export default function CalendarView({ onDaySelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { expenses, categories } = useExpenseStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const getExpensesForDate = (date: Date): Expense[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return expenses.filter(expense => expense.date === dateString);
  };

  const getTotalForDate = (date: Date): number => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    const dayExpenses = getExpensesForDate(date);
    onDaySelect(date, dayExpenses);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  // Calculate the starting day of the week for the first day of the month
  const firstDayOfMonth = monthStart.getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <View className="bg-secondary rounded-lg border border-border p-4">
      {/* Calendar Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={previousMonth} className="p-2">
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={nextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View className="flex-row mb-2">
        {WEEKDAYS.map(day => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-muted-foreground text-sm font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {/* Empty days for proper alignment */}
        {emptyDays.map((_, index) => (
          <View key={`empty-${index}`} className="w-[14.28%] h-12" />
        ))}
        
        {/* Calendar days */}
        {daysInMonth.map(date => {
          const dayExpenses = getExpensesForDate(date);
          const total = getTotalForDate(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <TouchableOpacity
              key={format(date, 'yyyy-MM-dd')}
              onPress={() => handleDayPress(date)}
              className={`w-[14.28%] h-12 items-center justify-center rounded ${
                isSelected 
                  ? 'bg-primary' 
                  : isToday 
                  ? 'bg-accent' 
                  : dayExpenses.length > 0 
                  ? 'bg-muted' 
                  : ''
              }`}
            >
              <Text className={`text-sm font-medium ${
                isSelected 
                  ? 'text-primary-foreground' 
                  : isToday 
                  ? 'text-foreground' 
                  : dayExpenses.length > 0 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                {format(date, 'd')}
              </Text>
              {total > 0 && (
                <View className="absolute -bottom-1">
                  <View className={`h-1 w-1 rounded-full ${
                    isSelected ? 'bg-primary-foreground' : 'bg-primary'
                  }`} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Info */}
      {selectedDate && (
        <View className="mt-4 pt-4 border-t border-border">
          <Text className="text-foreground font-semibold mb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          {getExpensesForDate(selectedDate).length > 0 ? (
            <ScrollView className="max-h-32">
              {getExpensesForDate(selectedDate).map(expense => (
                <View key={expense.id} className="flex-row items-center justify-between py-1">
                  <View className="flex-1">
                    <Text className="text-foreground text-sm">{expense.description}</Text>
                    <Text className="text-muted-foreground text-xs">
                      {getCategoryName(expense.category)}
                    </Text>
                  </View>
                  <Text className="text-foreground text-sm font-medium">
                    ${expense.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
              <View className="flex-row justify-between pt-2 border-t border-border/50">
                <Text className="text-foreground font-medium">Total</Text>
                <Text className="text-foreground font-bold">
                  ${getTotalForDate(selectedDate).toFixed(2)}
                </Text>
              </View>
            </ScrollView>
          ) : (
            <Text className="text-muted-foreground text-sm">No expenses for this day</Text>
          )}
        </View>
      )}
    </View>
  );
}