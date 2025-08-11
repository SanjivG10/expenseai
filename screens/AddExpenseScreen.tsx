import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { InlineLoader } from '../components/LoadingScreen';
import { apiService } from '../services/api';
import { Category, CategoryWithStats, CreateExpenseRequest } from '../types';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.string().min(1, 'Category is required'),
  expense_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface AddExpenseScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void; // Callback to refresh parent data
  initialData?: any;
}

// Default categories - will be replaced with API data
const defaultCategories = [
  { id: 'food', name: 'Food & Drink', icon: 'restaurant-outline' },
  { id: 'transport', name: 'Transport', icon: 'car-outline' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline' },
  { id: 'entertainment', name: 'Entertainment', icon: 'play-circle-outline' },
  { id: 'groceries', name: 'Groceries', icon: 'basket-outline' },
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical-outline' },
  { id: 'other', name: 'Other', icon: 'card-outline' },
];

export default function AddExpenseScreen({
  visible,
  onClose,
  onSave,
  initialData,
}: AddExpenseScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<(Category | CategoryWithStats)[]>([]);

  console.log({ categories });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      category_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedCategory = watch('category_id');

  // Load categories from API
  const loadCategories = async () => {
    try {
      // For now, create a simple category API call
      // Later we can optimize this by getting from settings API
      const response = await apiService.getCategories();
      console.log(JSON.stringify(response, null, 2));
      if (response.success && response.data?.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories',
      });
      setCategories(defaultCategories as Category[]);
    }
  };

  // Initialize form and load categories when modal opens
  useEffect(() => {
    if (visible) {
      // Load categories first
      loadCategories();

      if (initialData) {
        reset({
          amount: initialData.amount?.toString() || '',
          description: initialData.description || '',
          category_id: initialData.category_id || initialData.category || '',
          expense_date:
            initialData.expense_date || initialData.date || new Date().toISOString().split('T')[0],
          notes: initialData.notes || '',
        });
        setSelectedImage(initialData.receipt_image_url || initialData.image || null);
      } else {
        // Reset form for new expense
        reset({
          amount: '',
          description: '',
          category_id: '',
          expense_date: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setSelectedImage(null);
      }
    }
  }, [visible, initialData, reset]);

  const pickImage = async () => {
    if (isLoading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
      });
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string | null> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const onSubmit = async (data: ExpenseForm) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Handle image upload if selected
      let imageUrl = null;
      if (selectedImage && selectedImage.startsWith('file://')) {
        // Convert image to base64 and upload to Supabase
        const imageData = await convertImageToBase64(selectedImage);
        if (imageData) {
          const uploadResponse = await apiService.uploadReceiptImage(imageData);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = uploadResponse.data.image_url;
          } else {
            throw new Error('Failed to upload image');
          }
        }
      } else if (selectedImage && selectedImage.startsWith('http')) {
        // Already a URL, use as is
        imageUrl = selectedImage;
      }

      const expenseData: CreateExpenseRequest = {
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: data.category_id,
        expense_date: data.expense_date,
        notes: data.notes || undefined,
        receipt_image: imageUrl || undefined,
      };

      let response;
      if (initialData?.id) {
        // Update existing expense
        response = await apiService.updateExpense(initialData.id, expenseData);
      } else {
        // Create new expense
        response = await apiService.createExpense(expenseData);
      }

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: initialData ? 'Expense updated successfully' : 'Expense added successfully',
        });

        // Reset form and close
        reset();
        setSelectedImage(null);
        onClose();

        // Trigger parent refresh
        onSave?.();
      } else {
        throw new Error(response.message || 'Failed to save expense');
      }
    } catch (error: any) {
      console.error('Save expense error:', JSON.stringify(error, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save expense. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;

    // Reset form state
    reset();
    setSelectedImage(null);
    setShowDatePicker(false);
    setShowCategoryPicker(false);
    onClose();
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.icon || 'card-outline';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || 'Select Category';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header */}
        <View
          className={`flex-row items-center justify-between border-b border-border px-6 pb-4 pt-14 ${isLoading ? 'opacity-50' : ''}`}>
          <TouchableOpacity onPress={handleClose} disabled={isLoading}>
            <Ionicons name="close" size={24} color={isLoading ? '#666666' : '#FFFFFF'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">
            {initialData ? 'Edit Expense' : 'Add Expense'}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading || !isValid}
            className={`rounded-lg px-4 py-2 ${isLoading || !isValid ? 'bg-muted' : 'bg-primary'}`}>
            {isLoading ? (
              <View className="flex-row items-center">
                <InlineLoader size="small" showDots={false} />
                <Text className="ml-2 font-semibold text-muted-foreground">Saving...</Text>
              </View>
            ) : (
              <Text
                className={`font-semibold ${isValid ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className={`flex-1 px-6 ${isLoading ? 'opacity-50' : ''}`}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isLoading}>
          {/* Amount Input */}
          <View className="mt-6">
            <Text className="mb-2 text-sm font-medium text-foreground">Amount *</Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <View
                  className={`flex-row items-center rounded-lg border bg-input ${
                    errors.amount ? 'border-destructive' : 'border-border'
                  }`}>
                  <Text className="px-4 text-lg font-medium text-foreground">$</Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="0.00"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                    editable={!isLoading}
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
                  editable={!isLoading}
                  className={`rounded-lg border bg-input px-4 py-4 text-foreground ${
                    errors.description ? 'border-destructive' : 'border-border'
                  }`}
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
              onPress={() => !isLoading && setShowCategoryPicker(true)}
              disabled={isLoading}
              className={`flex-row items-center justify-between rounded-lg border bg-input px-4 py-4 ${
                errors.category_id ? 'border-destructive' : 'border-border'
              }`}>
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
            {errors.category_id && (
              <Text className="mt-1 text-sm text-destructive">{errors.category_id.message}</Text>
            )}
          </View>

          {/* Date Picker */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Date *</Text>
            <Controller
              control={control}
              name="expense_date"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    onPress={() => !isLoading && setShowDatePicker(true)}
                    disabled={isLoading}
                    className="flex-row items-center justify-between rounded-lg border border-border bg-input px-4 py-4">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                      <Text className="ml-3 text-foreground">
                        {value ? new Date(value).toLocaleDateString() : 'Select Date'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#a3a3a3" />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={value ? new Date(value) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const formattedDate = selectedDate.toISOString().split('T')[0];
                          onChange(formattedDate);
                        }
                      }}
                    />
                  )}
                </>
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
                  editable={!isLoading}
                  className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                />
              )}
            />
          </View>

          {/* Image Section */}
          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Image (Optional)</Text>
            {selectedImage ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="h-48 w-full rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => !isLoading && setSelectedImage(null)}
                  disabled={isLoading}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-2">
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                disabled={isLoading}
                className="items-center rounded-lg border-2 border-dashed border-border bg-secondary p-8">
                <Ionicons name="camera-outline" size={32} color="#a3a3a3" />
                <Text className="mt-2 text-muted-foreground">Add Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="h-8" />
        </ScrollView>

        {/* Loading Overlay */}
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center bg-background/50">
            <View className="items-center rounded-xl bg-secondary p-6">
              <InlineLoader size="medium" message="" showDots={false} />
              <Text className="mt-2 font-medium text-foreground">
                {initialData ? 'Updating expense...' : 'Adding expense...'}
              </Text>
            </View>
          </View>
        )}

        {/* Category Picker Modal */}
        <Modal visible={showCategoryPicker && !isLoading} animationType="slide" transparent>
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
                      setValue('category_id', category.id);
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
