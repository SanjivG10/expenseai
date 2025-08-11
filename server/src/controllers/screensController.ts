import { Request, Response } from 'express';
import { ApiResponse } from '../types/api';
import {
  DashboardData,
  ExpensesScreenData,
  AnalyticsData,
  GetCategories,
  ProcessReceiptResponse,
} from '../types/database';
import {
  getDashboardDataService,
  getExpensesDataService,
  getAnalyticsDataService,
  getCategories,
  processReceiptImageService,
} from '../services/screensService';
import {
  DashboardQueryData,
  ExpensesQueryData,
  AnalyticsQueryData,
  ProcessReceiptData,
} from '../utils/validation';

// Get all dashboard data in one call
export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query as unknown as DashboardQueryData;
    const data = await getDashboardDataService(userId, query);

    const response: ApiResponse<DashboardData> = {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard data error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Get all expenses screen data (with filters and pagination)
export const getExpensesData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query as unknown as ExpensesQueryData;
    const data = await getExpensesDataService(userId, query);

    const response: ApiResponse<ExpensesScreenData> = {
      success: true,
      message: 'Expenses data retrieved successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Expenses data error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve expenses data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Get all analytics data
export const getAnalyticsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query as AnalyticsQueryData;
    const data = await getAnalyticsDataService(userId, query);

    const response: ApiResponse<AnalyticsData> = {
      success: true,
      message: 'Analytics data retrieved successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Analytics data error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve analytics data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Get all settings data
export const getCategoriesData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await getCategories(userId);

    const response: ApiResponse<GetCategories> = {
      success: true,
      message: 'Settings data retrieved successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Settings data error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve settings data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

// Process receipt image with AI
export const processReceiptImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { image } = req.body as ProcessReceiptData;
    const data = await processReceiptImageService(userId, image);

    const response: ApiResponse<ProcessReceiptResponse> = {
      success: true,
      message: 'Receipt processed successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Receipt processing error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to process receipt',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};
