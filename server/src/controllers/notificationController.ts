import { Request, Response } from 'express';
import { ApiResponse } from '../types/api';

// Test notification endpoints for development/testing purposes
export const testDailyNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Mock notification content for testing
    const notificationContent = {
      title: '🌙 Daily Budget Reminder',
      body: '💰 You have $25.50 remaining in your daily budget of $50.00. Sleep well!',
      data: {
        type: 'daily_budget',
        userId: userId,
        timestamp: new Date().toISOString(),
      }
    };

    // In production, this would trigger an actual notification
    console.log(`[TEST] Daily notification for user ${userId}:`, notificationContent);

    const response: ApiResponse = {
      success: true,
      message: 'Daily notification test sent successfully',
      data: {
        notification_sent: true,
        notification_content: `${notificationContent.title}: ${notificationContent.body}`,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Test daily notification error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to send test daily notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

export const testWeeklyNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Mock notification content for testing
    const notificationContent = {
      title: '📊 Weekly Budget Summary',
      body: '🔶 Weekly spending: $180.75 of $300.00 (60%). You\'re doing great this week!',
      data: {
        type: 'weekly_budget',
        userId: userId,
        timestamp: new Date().toISOString(),
      }
    };

    // In production, this would trigger an actual notification
    console.log(`[TEST] Weekly notification for user ${userId}:`, notificationContent);

    const response: ApiResponse = {
      success: true,
      message: 'Weekly notification test sent successfully',
      data: {
        notification_sent: true,
        notification_content: `${notificationContent.title}: ${notificationContent.body}`,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Test weekly notification error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to send test weekly notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};

export const testMonthlyNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Mock notification content for testing
    const notificationContent = {
      title: '📈 Monthly Budget Summary',
      body: '💰 Monthly budget remaining: $450.25 of $1,500.00. Keep up the good work!',
      data: {
        type: 'monthly_budget',
        userId: userId,
        timestamp: new Date().toISOString(),
      }
    };

    // In production, this would trigger an actual notification
    console.log(`[TEST] Monthly notification for user ${userId}:`, notificationContent);

    const response: ApiResponse = {
      success: true,
      message: 'Monthly notification test sent successfully',
      data: {
        notification_sent: true,
        notification_content: `${notificationContent.title}: ${notificationContent.body}`,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Test monthly notification error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to send test monthly notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
};