import { Alert } from 'react-native';
import { formatNotificationTime, UserPreferences } from '../types';
import { apiService } from './api';

// Mock notification service - replace with expo-notifications when ready
class NotificationService {
  private notificationsPermission: 'granted' | 'denied' | 'undetermined' = 'undetermined';

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    // Mock implementation - replace with actual permission request
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Notifications',
        'ExpenseAI would like to send you spending reminders and budget updates. Enable notifications?',
        [
          {
            text: 'Don\'t Allow',
            style: 'cancel',
            onPress: () => {
              this.notificationsPermission = 'denied';
              resolve(false);
            },
          },
          {
            text: 'Allow',
            onPress: () => {
              this.notificationsPermission = 'granted';
              resolve(true);
            },
          },
        ]
      );
    });
  }

  // Check if notifications are enabled
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    return this.notificationsPermission;
  }

  // Schedule daily budget reminder
  async scheduleDailyNotification(preferences: UserPreferences): Promise<boolean> {
    if (this.notificationsPermission !== 'granted' || !preferences.notifications_enabled || !preferences.daily_notifications) {
      return false;
    }

    try {
      // Get current spending for today
      const today = new Date().toISOString().split('T')[0];
      // Mock calculation - in real implementation, fetch from API
      const todaySpent = 0; // Replace with actual API call
      const dailyBudget = preferences.daily_budget;
      
      let notificationBody = '';
      if (dailyBudget) {
        const remaining = dailyBudget - todaySpent;
        const percentage = Math.round((todaySpent / dailyBudget) * 100);
        
        if (percentage >= 100) {
          notificationBody = `⚠️ You've exceeded your daily budget of $${dailyBudget.toFixed(2)} by $${(todaySpent - dailyBudget).toFixed(2)}`;
        } else if (percentage >= 80) {
          notificationBody = `🔶 You've spent $${todaySpent.toFixed(2)} of your $${dailyBudget.toFixed(2)} daily budget (${percentage}%)`;
        } else {
          notificationBody = `💰 You have $${remaining.toFixed(2)} remaining in your daily budget`;
        }
      } else {
        notificationBody = `📊 You spent $${todaySpent.toFixed(2)} today. Track tomorrow's expenses!`;
      }

      // Mock scheduling - replace with actual notification scheduling
      console.log(`[MOCK] Daily notification scheduled for ${formatNotificationTime(preferences.daily_notification_time)}: ${notificationBody}`);
      
      return true;
    } catch (error) {
      console.error('Error scheduling daily notification:', error);
      return false;
    }
  }

  // Schedule weekly budget reminder  
  async scheduleWeeklyNotification(preferences: UserPreferences): Promise<boolean> {
    if (this.notificationsPermission !== 'granted' || !preferences.notifications_enabled || !preferences.weekly_notifications) {
      return false;
    }

    try {
      // Mock calculation - in real implementation, fetch from API
      const weekSpent = 0; // Replace with actual API call  
      const weeklyBudget = preferences.weekly_budget;
      
      let notificationBody = '';
      if (weeklyBudget) {
        const remaining = weeklyBudget - weekSpent;
        const percentage = Math.round((weekSpent / weeklyBudget) * 100);
        
        if (percentage >= 100) {
          notificationBody = `⚠️ Weekly budget exceeded! Spent $${weekSpent.toFixed(2)} of $${weeklyBudget.toFixed(2)}`;
        } else if (percentage >= 80) {
          notificationBody = `🔶 Weekly spending: $${weekSpent.toFixed(2)} of $${weeklyBudget.toFixed(2)} (${percentage}%)`;
        } else {
          notificationBody = `💰 Weekly budget remaining: $${remaining.toFixed(2)} of $${weeklyBudget.toFixed(2)}`;
        }
      } else {
        notificationBody = `📊 This week you spent $${weekSpent.toFixed(2)}. How will you do next week?`;
      }

      // Mock scheduling - replace with actual notification scheduling
      console.log(`[MOCK] Weekly notification scheduled for ${formatNotificationTime(preferences.weekly_notification_time)}: ${notificationBody}`);
      
      return true;
    } catch (error) {
      console.error('Error scheduling weekly notification:', error);
      return false;
    }
  }

  // Schedule monthly budget reminder
  async scheduleMonthlyNotification(preferences: UserPreferences): Promise<boolean> {
    if (this.notificationsPermission !== 'granted' || !preferences.notifications_enabled || !preferences.monthly_notifications) {
      return false;
    }

    try {
      // Mock calculation - in real implementation, fetch from API
      const monthSpent = 0; // Replace with actual API call
      const monthlyBudget = preferences.monthly_budget;
      
      let notificationBody = '';
      if (monthlyBudget) {
        const remaining = monthlyBudget - monthSpent;
        const percentage = Math.round((monthSpent / monthlyBudget) * 100);
        
        if (percentage >= 100) {
          notificationBody = `⚠️ Monthly budget exceeded! Spent $${monthSpent.toFixed(2)} of $${monthlyBudget.toFixed(2)}`;
        } else if (percentage >= 80) {
          notificationBody = `🔶 Monthly spending: $${monthSpent.toFixed(2)} of $${monthlyBudget.toFixed(2)} (${percentage}%)`;
        } else {
          notificationBody = `💰 Monthly budget remaining: $${remaining.toFixed(2)} of $${monthlyBudget.toFixed(2)}`;
        }
      } else {
        notificationBody = `📊 This month you spent $${monthSpent.toFixed(2)}. Great job tracking!`;
      }

      // Mock scheduling - replace with actual notification scheduling  
      console.log(`[MOCK] Monthly notification scheduled for ${formatNotificationTime(preferences.monthly_notification_time)}: ${notificationBody}`);
      
      return true;
    } catch (error) {
      console.error('Error scheduling monthly notification:', error);
      return false;
    }
  }

  // Schedule all notifications based on user preferences
  async scheduleAllNotifications(): Promise<void> {
    try {
      const response = await apiService.getUserPreferences();
      if (!response.success || !response.data) {
        console.error('Failed to get user preferences for notifications');
        return;
      }

      const preferences = response.data;
      
      // Schedule each type of notification
      await this.scheduleDailyNotification(preferences);
      await this.scheduleWeeklyNotification(preferences);  
      await this.scheduleMonthlyNotification(preferences);
      
      console.log('All notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling all notifications:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    // Mock implementation - replace with actual notification cancellation
    console.log('[MOCK] All notifications cancelled');
  }

  // Test notification methods for Settings screen
  async testDailyNotification(): Promise<void> {
    Alert.alert(
      '🌙 Daily Reminder (Test)',
      '💰 You have $25.50 remaining in your daily budget of $50.00. Sleep well!',
      [{ text: 'OK' }]
    );
  }

  async testWeeklyNotification(): Promise<void> {
    Alert.alert(
      '📊 Weekly Summary (Test)', 
      '🔶 Weekly spending: $180.75 of $300.00 (60%). You\'re doing great this week!',
      [{ text: 'OK' }]
    );
  }

  async testMonthlyNotification(): Promise<void> {
    Alert.alert(
      '📈 Monthly Summary (Test)',
      '💰 Monthly budget remaining: $450.25 of $1,500.00. Keep up the good work!',
      [{ text: 'OK' }]
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;

// Best timing recommendations:
// Daily: 21:00 (9 PM) - Before sleep, allows reflection on the day
// Weekly: Sunday 10:00 AM - Weekend morning, fresh start for the week  
// Monthly: Last day 10:00 AM - End of month summary, planning for next month