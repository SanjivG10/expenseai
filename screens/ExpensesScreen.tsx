import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useExpenseStore } from '../store/expenseStore';

export default function ExpensesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { expenses, categories } = useExpenseStore();

  const categoryOptions = ['All', ...categories.map((cat) => cat.name)];

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || 'receipt-outline';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryName = getCategoryName(expense.category);
      const matchesCategory =
        filterCategory === null || filterCategory === 'All' || categoryName === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return getCategoryName(a.category).localeCompare(getCategoryName(b.category));
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Expenses</Text>
        <Text className="mt-1 text-sm text-muted-foreground">{expenses.length} transactions</Text>
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
                  sortBy === option.key ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Expenses List */}
      <ScrollView className="mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
        {filteredExpenses.map((expense) => (
          <TouchableOpacity
            key={expense.id}
            className="mb-3 flex-row items-center rounded-lg border border-border bg-secondary p-4">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Ionicons name={getCategoryIcon(expense.category) as any} size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{expense.description}</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                {getCategoryName(expense.category)} • {expense.date}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold text-foreground">
                ${expense.amount.toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredExpenses.length === 0 && (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={64} color="#404040" />
            <Text className="mt-4 text-lg text-muted-foreground">No expenses found</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}

        {/* Bottom Spacing for Tab Bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
