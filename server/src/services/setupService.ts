import { supabase } from '../config/supabase';

// Default categories that will be created for new users
const defaultCategories = [
  { name: 'Food & Drink', icon: 'restaurant-outline', color: '#FF6B6B' },
  { name: 'Transport', icon: 'car-outline', color: '#4ECDC4' },
  { name: 'Shopping', icon: 'bag-outline', color: '#45B7D1' },
  { name: 'Entertainment', icon: 'play-circle-outline', color: '#96CEB4' },
  { name: 'Groceries', icon: 'basket-outline', color: '#FFEAA7' },
  { name: 'Utilities', icon: 'flash-outline', color: '#DDA0DD' },
  { name: 'Healthcare', icon: 'medical-outline', color: '#98D8C8' },
  { name: 'Other', icon: 'card-outline', color: '#F7DC6F' },
];

// Create default categories for a new user
export const createDefaultCategoriesForUser = async (userId: string): Promise<void> => {
  try {
    // Check if user already has categories
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check existing categories: ${checkError.message}`);
    }

    // If user already has categories, don't create defaults
    if (existingCategories && existingCategories.length > 0) {
      return;
    }

    // Insert default categories
    const categoriesToInsert = defaultCategories.map((category) => ({
      user_id: userId,
      ...category,
      is_default: true,
    }));

    const { error: insertError } = await supabase.from('categories').insert(categoriesToInsert);

    if (insertError) {
      throw new Error(`Failed to create default categories: ${insertError.message}`);
    }

    console.log(`Created default categories for user: ${userId}`);
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
};
