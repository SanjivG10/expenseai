import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { CalendarExpense } from '../types/api';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarViewProps {
  onDaySelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  calendarData: Record<string, CalendarExpense[]>;
  selectedDate: Date;
}

export default function CalendarView({ onDaySelect, onMonthChange, calendarData, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(selectedDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    setLocalSelectedDate(null);
    onMonthChange(newDate);
  };

  const nextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    setLocalSelectedDate(null);
    onMonthChange(newDate);
  };

  const getExpensesForDate = (date: Date): CalendarExpense[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return calendarData[dateString] || [];
  };

  const getTotalForDate = (date: Date): number => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const handleDayPress = (date: Date) => {
    setLocalSelectedDate(date);
    onDaySelect(date);
  };

  // Remove category lookup since we have category names in calendar data

  // Calculate the starting day of the week for the first day of the month
  const firstDayOfMonth = monthStart.getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <View className="rounded-lg border border-border bg-secondary p-4">
      {/* Calendar Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={previousMonth} className="p-2">
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={nextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View className="mb-2 flex-row">
        {WEEKDAYS.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-sm font-medium text-muted-foreground">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {/* Empty days for proper alignment */}
        {emptyDays.map((_, index) => (
          <View key={`empty-${index}`} className="h-12 w-[14.28%]" />
        ))}

        {/* Calendar days */}
        {daysInMonth.map((date) => {
          const dayExpenses = getExpensesForDate(date);
          const total = getTotalForDate(date);
          const isSelected = localSelectedDate && isSameDay(date, localSelectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <TouchableOpacity
              key={format(date, 'yyyy-MM-dd')}
              onPress={() => handleDayPress(date)}
              className={`h-12 w-[14.28%] items-center justify-center rounded ${
                isSelected
                  ? 'bg-primary'
                  : isToday
                    ? 'bg-accent'
                    : dayExpenses.length > 0
                      ? 'bg-muted'
                      : ''
              }`}>
              <Text
                className={`text-sm font-medium ${
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
                  <View
                    className={`h-1 w-1 rounded-full ${
                      isSelected ? 'bg-primary-foreground' : 'bg-primary'
                    }`}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Info */}
      {localSelectedDate && (
        <View className="mt-4 border-t border-border pt-4">
          <Text className="mb-2 font-semibold text-foreground">
            {format(localSelectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          {getExpensesForDate(localSelectedDate).length > 0 ? (
            <ScrollView className="max-h-32">
              {getExpensesForDate(localSelectedDate).map((expense) => (
                <View key={expense.id} className="flex-row items-center justify-between py-1">
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">{expense.description}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {expense.category_name}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    ${expense.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
              <View className="flex-row justify-between border-t border-border/50 pt-2">
                <Text className="font-medium text-foreground">Total</Text>
                <Text className="font-bold text-foreground">
                  ${getTotalForDate(localSelectedDate).toFixed(2)}
                </Text>
              </View>
            </ScrollView>
          ) : (
            <Text className="text-sm text-muted-foreground">No expenses for this day</Text>
          )}
        </View>
      )}
    </View>
  );
}
