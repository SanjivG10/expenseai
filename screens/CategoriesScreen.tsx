import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useExpenseStore, Category } from '../store/expenseStore';

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

interface CategoriesScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function CategoriesScreen({ visible, onClose }: CategoriesScreenProps) {
  const { categories, addCategory, deleteCategory } = useExpenseStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('card-outline');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        icon: selectedIcon,
      };
      addCategory(newCategory);
      setNewCategoryName('');
      setSelectedIcon('card-outline');
      setShowAddForm(false);
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? Expenses in this category will be moved to "Other".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(categoryId),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="bg-background flex-1">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header */}
        <View className="border-border flex-row items-center justify-between border-b px-6 pb-4 pt-14">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Manage Categories</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="bg-primary rounded-lg px-4 py-2">
            <Text className="text-primary-foreground font-semibold">Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4">
          {/* Categories List */}
          {categories.map((category) => (
            <View
              key={category.id}
              className="border-border bg-secondary mb-3 flex-row items-center rounded-lg border p-4">
              <View className="bg-accent mr-4 h-12 w-12 items-center justify-center rounded-full">
                <Ionicons name={category.icon as any} size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{category.name}</Text>
              </View>
              {category.id !== 'other' && (
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(category.id, category.name)}
                  className="ml-2 p-2">
                  <Ionicons name="trash-outline" size={20} color="#666666" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View className="h-10" />
        </ScrollView>

        {/* Add Category Modal */}
        <Modal visible={showAddForm} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/50">
            <View className="border-border bg-background max-h-96 rounded-t-xl border-t p-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-foreground text-lg font-semibold">Add New Category</Text>
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Category Name */}
              <View className="mb-4">
                <Text className="text-foreground mb-2 text-sm font-medium">Category Name</Text>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#a3a3a3"
                  className="border-border bg-input text-foreground rounded-lg border px-4 py-3"
                />
              </View>

              {/* Icon Selection */}
              <View className="mb-6">
                <Text className="text-foreground mb-2 text-sm font-medium">Select Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {availableIcons.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => setSelectedIcon(icon)}
                        className={`h-12 w-12 items-center justify-center rounded-lg ${
                          selectedIcon === icon ? 'bg-primary' : 'border-border bg-secondary border'
                        }`}>
                        <Ionicons
                          name={icon as any}
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
                disabled={!newCategoryName.trim()}
                className={`rounded-lg p-4 ${newCategoryName.trim() ? 'bg-primary' : 'bg-muted'}`}>
                <Text
                  className={`text-center font-semibold ${
                    newCategoryName.trim() ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                  Add Category
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
