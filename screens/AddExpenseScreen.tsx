import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface AddExpenseScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (expense: any) => void;
}

const categories = [
  { id: 'food', name: 'Food & Drink', icon: 'restaurant-outline' },
  { id: 'transport', name: 'Transport', icon: 'car-outline' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline' },
  { id: 'entertainment', name: 'Entertainment', icon: 'play-circle-outline' },
  { id: 'groceries', name: 'Groceries', icon: 'basket-outline' },
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical-outline' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function AddExpenseScreen({ visible, onClose, onSave }: AddExpenseScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedCategory = watch('category');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const onSubmit = (data: ExpenseForm) => {
    const expense = {
      ...data,
      amount: parseFloat(data.amount),
      image: selectedImage,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    onSave?.(expense);
    reset();
    setSelectedImage(null);
    onClose();
  };

  const handleClose = () => {
    reset();
    setSelectedImage(null);
    onClose();
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.icon || 'ellipsis-horizontal-outline';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || 'Select Category';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-6 pb-4 pt-14">
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Add Expense</Text>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            className="rounded-lg bg-primary px-4 py-2">
            <Text className="font-semibold text-primary-foreground">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View className="mt-6">
            <Text className="mb-2 text-sm font-medium text-foreground">Amount *</Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <Text className="px-4 text-lg font-medium text-foreground">$</Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="0.00"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                    className="flex-1 py-4 pr-4 text-lg text-foreground"
                  />
                </View>
              )}
            />
            {errors.amount && (
              <Text className="mt-1 text-sm text-destructive">{errors.amount.message}</Text>
            )}
          </View>

          {/* Description Input */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Description *</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="What did you buy?"
                  placeholderTextColor="#a3a3a3"
                  className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                />
              )}
            />
            {errors.description && (
              <Text className="mt-1 text-sm text-destructive">{errors.description.message}</Text>
            )}
          </View>

          {/* Category Picker */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Category *</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              className="flex-row items-center justify-between rounded-lg border border-border bg-input px-4 py-4">
              <View className="flex-row items-center">
                <Ionicons
                  name={getCategoryIcon(selectedCategory) as any}
                  size={20}
                  color="#FFFFFF"
                />
                <Text className="ml-3 text-foreground">{getCategoryName(selectedCategory)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a3a3a3" />
            </TouchableOpacity>
            {errors.category && (
              <Text className="mt-1 text-sm text-destructive">{errors.category.message}</Text>
            )}
          </View>

          {/* Date Input */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Date *</Text>
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a3a3a3"
                  className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                />
              )}
            />
          </View>

          {/* Notes Input */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Notes (Optional)</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Additional notes..."
                  placeholderTextColor="#a3a3a3"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                />
              )}
            />
          </View>

          {/* Image Section */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">
              Receipt Image (Optional)
            </Text>
            {selectedImage ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="h-48 w-full rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-2">
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                className="items-center rounded-lg border-2 border-dashed border-border bg-secondary p-8">
                <Ionicons name="camera-outline" size={32} color="#a3a3a3" />
                <Text className="mt-2 text-muted-foreground">Add Receipt Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="h-8" />
        </ScrollView>

        {/* Category Picker Modal */}
        <Modal visible={showCategoryPicker} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-xl border-t border-border bg-background">
              <View className="border-b border-border p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-foreground">Select Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                    <Text className="text-primary">Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView className="max-h-80">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => {
                      setValue('category', category.id);
                      setShowCategoryPicker(false);
                    }}
                    className="flex-row items-center border-b border-border p-4">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-accent">
                      <Ionicons name={category.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <Text className="flex-1 text-foreground">{category.name}</Text>
                    {selectedCategory === category.id && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
