import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { apiService } from '../services/api';
import { Category, CreateCategoryRequest } from '../types';
import LoadingScreen, { InlineLoader } from '../components/LoadingScreen';
import Toast from 'react-native-toast-message';

const availableIcons = [
  'restaurant-outline',
  'car-outline',
  'bag-outline',
  'play-circle-outline',
  'basket-outline',
  'flash-outline',
  'medical-outline',
  'home-outline',
  'fitness-outline',
  'book-outline',
  'airplane-outline',
  'gift-outline',
  'paw-outline',
  'school-outline',
  'build-outline',
  'cafe-outline',
  'pizza-outline',
  'wine-outline',
  'bus-outline',
  'train-outline',
  'bicycle-outline',
  'walk-outline',
  'shirt-outline',
  'watch-outline',
  'phone-portrait-outline',
  'laptop-outline',
  'game-controller-outline',
  'musical-notes-outline',
  'film-outline',
  'camera-outline',
  'cut-outline',
  'brush-outline',
  'heart-outline',
  'leaf-outline',
  'flower-outline',
  'business-outline',
  'card-outline',
];

const availableColors = [
  '#FFFFFF', // White (default)
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
];

interface CategoriesScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function CategoriesScreen({ visible, onClose }: CategoriesScreenProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCategories();

      if (response.success && response.data) {
        const sortedCategories = response.data.categories.sort((a, b) => {
          // Put default categories first, then sort by name
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return a.name.localeCompare(b.name);
        });
        setCategories(sortedCategories);
      } else {
        Toast.show({
          text1: response.message || 'Failed to load categories',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Categories fetch error:', error);
      Toast.show({
        text1: 'Failed to load categories',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsAdding(true);
      const categoryData: CreateCategoryRequest = {
        name: newCategoryName.trim(),
        icon: selectedIcon,
        color: '#000000',
      };

      const response = await apiService.createCategory(categoryData);

      if (response.success && response.data) {
        setCategories((prev) => [...prev, response.data as Category]);
        setNewCategoryName('');
        setSelectedIcon('card-outline');
        // setSelectedColor('#FFFFFF');
        setShowAddForm(false);
        Toast.show({
          text1: 'Category created successfully',
          type: 'success',
        });
      } else {
        Toast.show({
          text1: response.message || 'Failed to create category',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Create category error:', error);
      Toast.show({
        text1: 'Failed to create category',
        type: 'error',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    // Prevent deletion if only one category exists
    if (categories.length <= 1) {
      Alert.alert(
        'Cannot Delete',
        'You must have at least one category. Please create another category before deleting this one.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? Expenses in this category will be moved to another category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteCategory(category.id),
        },
      ]
    );
  };

  const performDeleteCategory = async (categoryId: string) => {
    try {
      setIsDeleting(categoryId);
      const response = await apiService.deleteCategory(categoryId);

      if (response.success) {
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
        Toast.show({
          text1: 'Category deleted successfully',
          type: 'success',
        });
      } else {
        Toast.show({
          text1: response.message || 'Failed to delete category',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Delete category error:', error);
      Toast.show({
        text1: 'Failed to delete category',
        type: 'error',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setNewCategoryName('');
    setSelectedIcon('card-outline');
    // setSelectedColor('#FFFFFF');
    setShowAddForm(false);
  };

  // Loading state
  if (isLoading && categories.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <LoadingScreen message="Loading categories..." />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-6 pb-4 pt-14">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Manage Categories</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="rounded-lg bg-primary px-4 py-2">
            <Text className="font-semibold text-primary-foreground">Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4">
          {/* Categories List */}
          {categories.map((category) => (
            <View
              key={category.id}
              className="mb-3 flex-row items-center rounded-lg border border-border bg-secondary p-4">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full">
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={category.color === '#FFFFFF' ? '#000000' : '#FFFFFF'}
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{category.name}</Text>
                {category.is_default && (
                  <Text className="text-sm text-muted-foreground">Default category</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(category)}
                disabled={isDeleting === category.id}
                className="ml-2 p-2">
                {isDeleting === category.id ? (
                  <InlineLoader size="small" showDots={false} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
            </View>
          ))}

          {categories.length === 0 && !isLoading && (
            <View className="items-center justify-center py-12">
              <Ionicons name="list-outline" size={64} color="#404040" />
              <Text className="mt-4 text-lg text-muted-foreground">No categories found</Text>
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                Create your first category to get started
              </Text>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>

        {/* Add Category Modal */}
        <Modal visible={showAddForm} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/50">
            <View className="max-h-96 rounded-t-xl border-t border-border bg-background p-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">Add New Category</Text>
                <TouchableOpacity onPress={resetForm}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Category Name */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-medium text-foreground">Category Name</Text>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#a3a3a3"
                  className="rounded-lg border border-border bg-input px-4 py-3 text-foreground"
                  maxLength={100}
                />
              </View>

              {/* Icon Selection */}
              <View className="mb-6">
                <Text className="mb-2 text-sm font-medium text-foreground">Select Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {availableIcons.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => setSelectedIcon(icon)}
                        className={`h-12 w-12 items-center justify-center rounded-lg ${
                          selectedIcon === icon ? 'bg-primary' : 'border border-border bg-secondary'
                        }`}>
                        <Ionicons
                          name={icon as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={selectedIcon === icon ? '#000000' : '#FFFFFF'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                onPress={handleAddCategory}
                disabled={!newCategoryName.trim() || isAdding}
                className={`rounded-lg p-4 ${
                  newCategoryName.trim() && !isAdding ? 'bg-primary' : 'bg-muted'
                }`}>
                {isAdding ? (
                  <InlineLoader message="Creating category..." showDots={false} />
                ) : (
                  <Text
                    className={`text-center font-semibold ${
                      newCategoryName.trim() ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}>
                    Add Category
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
