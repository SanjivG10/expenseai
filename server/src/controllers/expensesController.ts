import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse } from '../types/api';
import { CreateExpenseData, UpdateExpenseData } from '../utils/validation';

// Create new expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseData = req.body as CreateExpenseData;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount: expenseData.amount,
        description: expenseData.description,
        category_id: expenseData.category_id,
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
    const { data: existingExpense, error: checkError } = await supabase
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

    // Update expense
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...(updateData.amount && { amount: updateData.amount }),
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.category_id && { category_id: updateData.category_id }),
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
    const { data: existingExpense, error: checkError } = await supabase
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
    const { error } = await supabase
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

    // TODO: Delete receipt image from storage if exists
    // if (existingExpense.receipt_image_url) {
    //   // Delete from Supabase Storage
    // }

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
