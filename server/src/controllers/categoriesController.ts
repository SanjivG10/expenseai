import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types/api';
import { CreateCategoryData, UpdateCategoryData } from '../utils/validation';

// Create new category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const categoryData = req.body as CreateCategoryData;

    // Check if category name already exists for this user
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', categoryData.name)
      .single();

    if (existingCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Category name already exists',
        error: 'Duplicate category name',
      };
      res.status(400).json(response);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Create category error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to create category',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category created successfully',
      data,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create category',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const categoryId = req.params.id;
    const updateData = req.body as UpdateCategoryData;

    // First check if category belongs to user
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('id, is_default')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found or access denied',
        error: 'Not found',
      };
      res.status(404).json(response);
      return;
    }

    // Don't allow updating default categories (optional restriction)
    if (existingCategory.is_default) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot modify default categories',
        error: 'Default category',
      };
      res.status(400).json(response);
      return;
    }

    // Check for duplicate name if name is being updated
    if (updateData.name) {
      const { data: duplicateCheck } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', updateData.name)
        .neq('id', categoryId)
        .single();

      if (duplicateCheck) {
        const response: ApiResponse = {
          success: false,
          message: 'Category name already exists',
          error: 'Duplicate category name',
        };
        res.status(400).json(response);
        return;
      }
    }

    // Update category
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.icon && { icon: updateData.icon }),
        ...(updateData.color && { color: updateData.color }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update category error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update category',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category updated successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Update category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update category',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const categoryId = req.params.id;

    // First check if category belongs to user
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('id, is_default, name')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found or access denied',
        error: 'Not found',
      };
      res.status(404).json(response);
      return;
    }

    // Don't allow deleting default categories (optional restriction)
    if (existingCategory.is_default) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete default categories',
        error: 'Default category',
      };
      res.status(400).json(response);
      return;
    }

    // Get or create "Other" category to reassign expenses
    let otherCategory;
    const { data: existingOther, error: otherCheckError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Other')
      .single();

    if (existingOther) {
      otherCategory = existingOther;
    } else {
      // Create "Other" category if it doesn't exist
      const { data: newOther, error: createOtherError } = await supabaseAdmin
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Other',
          icon: 'card-outline',
          color: '#F7DC6F',
          is_default: true,
        })
        .select()
        .single();

      if (createOtherError) {
        console.error('Create Other category error:', createOtherError);
        const response: ApiResponse = {
          success: false,
          message: 'Failed to create fallback category',
          error: createOtherError.message,
        };
        res.status(500).json(response);
        return;
      }

      otherCategory = newOther;
    }

    // Update all expenses to use "Other" category
    const { error: updateExpensesError } = await supabaseAdmin
      .from('expenses')
      .update({ category_id: otherCategory.id })
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    if (updateExpensesError) {
      console.error('Update expenses error:', updateExpensesError);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to reassign expenses to Other category',
        error: updateExpensesError.message,
      };
      res.status(500).json(response);
      return;
    }

    // Delete category
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete category error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete category',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully, expenses moved to Other category',
    };

    res.json(response);
  } catch (error) {
    console.error('Delete category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete category',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};
