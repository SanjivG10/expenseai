import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types/api';
import { CreateExpenseData, UpdateExpenseData } from '../utils/validation';

// Helper function to resolve category ID - handles both UUID and category names
async function resolveCategoryId(categoryIdentifier: string, userId: string): Promise<string> {
  // First, try to use it as-is if it looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(categoryIdentifier)) {
    // Verify the UUID exists for this user
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', categoryIdentifier)
      .eq('user_id', userId)
      .single();
    
    if (category) {
      return categoryIdentifier;
    }
  }
  
  // If not a valid UUID or UUID not found, try to find by name
  const { data: categoryByName } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', `%${categoryIdentifier}%`)
    .single();
  
  if (categoryByName) {
    return categoryByName.id;
  }
  
  // If still no match, try some common mappings for the default categories
  const categoryMappings: Record<string, string> = {
    'food': 'Food & Drink',
    'transport': 'Transport',
    'shopping': 'Shopping',
    'entertainment': 'Entertainment',
    'groceries': 'Groceries',
    'utilities': 'Utilities',
    'healthcare': 'Healthcare',
    'other': 'Other'
  };
  
  const mappedName = categoryMappings[categoryIdentifier.toLowerCase()];
  if (mappedName) {
    const { data: mappedCategory } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', mappedName)
      .single();
    
    if (mappedCategory) {
      return mappedCategory.id;
    }
  }
  
  // If nothing found, throw an error
  throw new Error(`Category not found: ${categoryIdentifier}`);
}

// Create new expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseData = req.body as CreateExpenseData;

    // Resolve category ID (handles both UUIDs and category names/IDs)
    let resolvedCategoryId;
    try {
      resolvedCategoryId = await resolveCategoryId(expenseData.category_id, userId);
    } catch (categoryError) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid category',
        error: categoryError instanceof Error ? categoryError.message : 'Category not found',
      };
      res.status(400).json(response);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: userId,
        amount: expenseData.amount,
        description: expenseData.description,
        category_id: resolvedCategoryId,
        expense_date: expenseData.expense_date,
        notes: expenseData.notes,
        receipt_image_url: expenseData.receipt_image, // In production, this would be a URL after file upload
      })
      .select(
        `
        *,
        categories (
          id,
          name,
          icon,
          color
        )
      `
      )
      .single();

    if (error) {
      console.error('Create expense error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to create expense',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Expense created successfully',
      data,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create expense error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create expense',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseId = req.params.id;
    const updateData = req.body as UpdateExpenseData;

    // First check if expense belongs to user
    const { data: existingExpense, error: checkError } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('id', expenseId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingExpense) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense not found or access denied',
        error: 'Not found',
      };
      res.status(404).json(response);
      return;
    }

    // Resolve category ID if provided
    let resolvedCategoryId;
    if (updateData.category_id) {
      try {
        resolvedCategoryId = await resolveCategoryId(updateData.category_id, userId);
      } catch (categoryError) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid category',
          error: categoryError instanceof Error ? categoryError.message : 'Category not found',
        };
        res.status(400).json(response);
        return;
      }
    }

    // Update expense
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update({
        ...(updateData.amount && { amount: updateData.amount }),
        ...(updateData.description && { description: updateData.description }),
        ...(resolvedCategoryId && { category_id: resolvedCategoryId }),
        ...(updateData.expense_date && { expense_date: updateData.expense_date }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        ...(updateData.receipt_image !== undefined && {
          receipt_image_url: updateData.receipt_image,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select(
        `
        *,
        categories (
          id,
          name,
          icon,
          color
        )
      `
      )
      .single();

    if (error) {
      console.error('Update expense error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update expense',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Expense updated successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Update expense error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update expense',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseId = req.params.id;

    // First check if expense belongs to user
    const { data: existingExpense, error: checkError } = await supabaseAdmin
      .from('expenses')
      .select('id, receipt_image_url')
      .eq('id', expenseId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingExpense) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense not found or access denied',
        error: 'Not found',
      };
      res.status(404).json(response);
      return;
    }

    // Delete expense
    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete expense error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete expense',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    if (existingExpense.receipt_image_url) {
      // we ahve this in the supabase storage
      const { error: deleteError } = await supabaseAdmin.storage
        .from('receipts')
        .remove([existingExpense.receipt_image_url]);

      if (deleteError) {
        console.error('Delete receipt image error:', deleteError);
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Expense deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Delete expense error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete expense',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};
