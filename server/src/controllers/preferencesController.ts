import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types/api';
import { OnboardingData, UpdatePreferencesData } from '../utils/validation';

// Complete onboarding and create user preferences
export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const onboardingData = req.body as OnboardingData;

    // Check if user already has preferences
    const { data: existingPrefs, error: checkError } = await supabaseAdmin
      .from('user_preferences')
      .select('id, onboarding_completed')
      .eq('user_id', userId)
      .single();

    if (existingPrefs?.onboarding_completed) {
      const response: ApiResponse = {
        success: false,
        message: 'Onboarding has already been completed',
        error: 'Already completed',
      };
      res.status(400).json(response);
      return;
    }

    // Convert dollar amounts to cents for database storage
    const preferencesData = {
      user_id: userId,
      daily_budget: onboardingData.daily_budget ? onboardingData.daily_budget : null,
      weekly_budget: onboardingData.weekly_budget ? onboardingData.weekly_budget : null,
      monthly_budget: onboardingData.monthly_budget ? onboardingData.monthly_budget : null,
      notifications_enabled: onboardingData.notifications_enabled,
      currency: onboardingData.currency || 'USD',
      onboarding_completed: true,
      // Keep default notification settings and times
      daily_notifications: true,
      weekly_notifications: true,
      monthly_notifications: true,
      daily_notification_time: 1260, // 9 PM (21:00)
      weekly_notification_time: 600, // 10 AM Sunday
      monthly_notification_time: 600, // 10 AM last day of month
    };

    let data;
    if (existingPrefs) {
      // Update existing record
      const { data: updatedData, error } = await supabaseAdmin
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update preferences error:', error);
        const response: ApiResponse = {
          success: false,
          message: 'Failed to complete onboarding',
          error: error.message,
        };
        res.status(400).json(response);
        return;
      }
      data = updatedData;
    } else {
      // Create new record
      const { data: newData, error } = await supabaseAdmin
        .from('user_preferences')
        .insert(preferencesData)
        .select()
        .single();

      if (error) {
        console.error('Create preferences error:', error);
        const response: ApiResponse = {
          success: false,
          message: 'Failed to complete onboarding',
          error: error.message,
        };
        res.status(400).json(response);
        return;
      }
      data = newData;
    }

    // Convert cents back to dollars for response
    const responseData = {
      ...data,
      daily_budget: data.daily_budget ? data.daily_budget / 100 : null,
      weekly_budget: data.weekly_budget ? data.weekly_budget / 100 : null,
      monthly_budget: data.monthly_budget ? data.monthly_budget / 100 : null,
    };

    const response: ApiResponse = {
      success: true,
      message: 'Onboarding completed successfully',
      data: responseData,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Complete onboarding error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to complete onboarding',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Get user preferences
export const getUserPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // If no preferences exist, create default ones
      const defaultPrefs = {
        user_id: userId,
        daily_budget: null,
        weekly_budget: null,
        monthly_budget: null,
        notifications_enabled: false,
        daily_notifications: true,
        weekly_notifications: true,
        monthly_notifications: true,
        daily_notification_time: 1260, // 9 PM
        weekly_notification_time: 600, // 10 AM Sunday
        monthly_notification_time: 600, // 10 AM last day of month
        currency: 'USD',
        onboarding_completed: false,
      };

      const { data: newData, error: createError } = await supabaseAdmin
        .from('user_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (createError) {
        console.error('Create default preferences error:', createError);
        const response: ApiResponse = {
          success: false,
          message: 'Failed to load user preferences',
          error: createError.message,
        };
        res.status(500).json(response);
        return;
      }

      const responseData = {
        ...newData,
        daily_budget: newData.daily_budget ? newData.daily_budget : null,
        weekly_budget: newData.weekly_budget ? newData.weekly_budget : null,
        monthly_budget: newData.monthly_budget ? newData.monthly_budget : null,
      };

      const response: ApiResponse = {
        success: true,
        message: 'Default preferences created',
        data: responseData,
      };
      res.json(response);
      return;
    }

    // Convert cents back to dollars for response
    const responseData = {
      ...data,
      daily_budget: data.daily_budget ? data.daily_budget / 100 : null,
      weekly_budget: data.weekly_budget ? data.weekly_budget / 100 : null,
      monthly_budget: data.monthly_budget ? data.monthly_budget / 100 : null,
    };

    const response: ApiResponse = {
      success: true,
      message: 'User preferences retrieved successfully',
      data: responseData,
    };

    res.json(response);
  } catch (error) {
    console.error('Get user preferences error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to load user preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Update user preferences
export const updateUserPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updateData = req.body as UpdatePreferencesData;

    // Convert dollar amounts to cents for database storage
    const dbUpdateData: any = { ...updateData };
    if (updateData.daily_budget !== undefined) {
      dbUpdateData.daily_budget = updateData.daily_budget ? updateData.daily_budget : null;
    }
    if (updateData.weekly_budget !== undefined) {
      dbUpdateData.weekly_budget = updateData.weekly_budget ? updateData.weekly_budget : null;
    }
    if (updateData.monthly_budget !== undefined) {
      dbUpdateData.monthly_budget = updateData.monthly_budget ? updateData.monthly_budget : null;
    }

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .update(dbUpdateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update preferences error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update preferences',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    // Convert cents back to dollars for response
    const responseData = {
      ...data,
      daily_budget: data.daily_budget ? data.daily_budget : null,
      weekly_budget: data.weekly_budget ? data.weekly_budget : null,
      monthly_budget: data.monthly_budget ? data.monthly_budget : null,
    };

    const response: ApiResponse = {
      success: true,
      message: 'Preferences updated successfully',
      data: responseData,
    };

    res.json(response);
  } catch (error) {
    console.error('Update user preferences error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};
