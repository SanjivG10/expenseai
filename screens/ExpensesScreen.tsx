import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useExpenseStore, Expense } from '../store/expenseStore';
import AddExpenseScreen from './AddExpenseScreen';

export default function ExpensesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { expenses, categories, updateExpense, deleteExpense } = useExpenseStore();

  const categoryOptions = ['All', ...categories.map((cat) => cat.name)];

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || 'receipt-outline';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteExpense(expense.id)
        }
      ]
    );
  };

  const handleUpdateExpense = (updatedExpense: any) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, {
        amount: updatedExpense.amount,
        description: updatedExpense.description,
        category: updatedExpense.category,
        date: updatedExpense.date,
        notes: updatedExpense.notes,
        image: updatedExpense.image,
      });
      setEditingExpense(null);
      setShowEditModal(false);
    }
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
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-4 pt-14">
        <Text className="text-foreground text-2xl font-bold">Expenses</Text>
        <Text className="text-muted-foreground mt-1 text-sm">{expenses.length} transactions</Text>
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
      <ScrollView className="mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
        {filteredExpenses.map((expense) => (
          <View
            key={expense.id}
            className="border-border bg-secondary mb-3 rounded-lg border overflow-hidden">
            <View className="flex-row items-center p-4">
              <View className="bg-accent mr-4 h-12 w-12 items-center justify-center rounded-full">
                <Ionicons name={getCategoryIcon(expense.category) as any} size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{expense.description}</Text>
                <Text className="text-muted-foreground mt-1 text-sm">
                  {getCategoryName(expense.category)} • {expense.date}
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

        {filteredExpenses.length === 0 && (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={64} color="#404040" />
            <Text className="text-muted-foreground mt-4 text-lg">No expenses found</Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm">
              Try adjusting your search or filter criteria
            </Text>
          </View>
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
