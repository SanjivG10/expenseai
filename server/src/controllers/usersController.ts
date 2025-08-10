import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse } from '../types/api';
import { UpdateProfileData } from '../utils/validation';

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updateData = req.body as UpdateProfileData;

    // Update user metadata in Supabase Auth
    const updatePayload: any = {};
    
    if (updateData.firstName || updateData.lastName) {
      updatePayload.data = {
        ...(updateData.firstName && { firstName: updateData.firstName }),
        ...(updateData.lastName && { lastName: updateData.lastName }),
      };
    }

    const { data, error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      console.error('Update profile error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update user profile',
        error: error.message,
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'User profile updated successfully',
      data: data.user,
    };

    res.json(response);
  } catch (error) {
    console.error('Update profile error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};
