import { addDays, endOfMonth, format, startOfMonth } from 'date-fns';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { supabaseAdmin } from '../config/supabase';

export class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  // Check if notification was already sent today
  private async hasNotificationBeenSentToday(
    userId: string,
    notificationType: 'daily' | 'weekly' | 'monthly'
  ): Promise<boolean> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabaseAdmin
        .from('notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', notificationType)
        .gte('sent_at', `${today}T00:00:00Z`)
        .lt('sent_at', `${today}T23:59:59Z`)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error(`Error checking notification log for user ${userId}:`, error);
        return false; // Allow sending if we can't check
      }

      return !!data; // Return true if notification was already sent today
    } catch (error) {
      console.error(`Failed to check notification log for user ${userId}:`, error);
      return false; // Allow sending if we can't check
    }
  }

  // Log that a notification was sent
  private async logNotificationSent(
    userId: string,
    notificationType: 'daily' | 'weekly' | 'monthly',
    timezone?: string,
    notificationTime?: number
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('notification_logs').insert({
        user_id: userId,
        notification_type: notificationType,
        timezone,
        notification_time: notificationTime,
      });

      if (error) {
        console.error(`Failed to log notification for user ${userId}:`, error);
      } else {
        console.log(`Logged ${notificationType} notification for user ${userId}`);
      }
    } catch (error) {
      console.error(`Failed to log notification for user ${userId}:`, error);
    }
  }

  // Clean up old notification logs (keep last 30 days)
  async cleanupOldNotificationLogs(): Promise<void> {
    try {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

      const { error } = await supabaseAdmin
        .from('notification_logs')
        .delete()
        .lt('sent_at', fortyDaysAgo.toISOString());

      if (error) {
        console.error('Failed to cleanup old notification logs:', error);
      } else {
        console.log('Cleaned up old notification logs (older than 30 days)');
      }
    } catch (error) {
      console.error('Failed to cleanup old notification logs:', error);
    }
  }

  // Send push notification to specific user
  async sendNotificationToUser(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return false;
      }

      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];

      if (ticket.status === 'error') {
        console.error(`Error sending push notification: ${ticket.message}`);
        return false;
      }

      console.log(`Push notification sent successfully to ${pushToken}`);
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Calculate spending progress for a user
  async calculateSpendingProgress(userId: string) {
    // Get user preferences including budget limits
    const { data: userPrefs, error: prefsError } = await supabaseAdmin
      .from('user_preferences')
      .select('daily_budget, weekly_budget, monthly_budget, push_token')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      throw new Error('User preferences not found');
    }

    const currentDate = new Date();
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
    const startOfCurrentMonth = startOfMonth(currentDate);
    const endOfCurrentMonth = endOfMonth(currentDate);

    // Get monthly expenses for calculations
    const { data: monthlyExpenses, error: monthlyError } = await supabaseAdmin
      .from('expenses')
      .select('amount, expense_date')
      .eq('user_id', userId)
      .gte('expense_date', format(startOfCurrentMonth, 'yyyy-MM-dd'))
      .lte('expense_date', format(endOfCurrentMonth, 'yyyy-MM-dd'));

    if (monthlyError) {
      throw new Error('Failed to fetch expenses');
    }

    const expenses = monthlyExpenses || [];

    // Calculate daily spending (today only)
    const todayExpenses = expenses.filter((exp) => exp.expense_date === currentDateStr);
    const dailySpent = todayExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Calculate weekly spending (current week - Sunday to Saturday)
    const weekStart = format(addDays(currentDate, -currentDate.getDay()), 'yyyy-MM-dd');
    const weekExpenses = expenses.filter((exp) => exp.expense_date >= weekStart);
    const weeklySpent = weekExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Calculate monthly spending (current month)
    const monthlySpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      userPrefs,
      daily: userPrefs.daily_budget
        ? {
            budget: userPrefs.daily_budget,
            spent: dailySpent,
            remaining: Math.max(0, userPrefs.daily_budget - dailySpent),
            percentage: Math.min(100, Math.round((dailySpent / userPrefs.daily_budget) * 100)),
            status:
              dailySpent >= userPrefs.daily_budget
                ? 'exceeded'
                : dailySpent >= userPrefs.daily_budget * 0.8
                  ? 'warning'
                  : 'safe',
          }
        : null,
      weekly: userPrefs.weekly_budget
        ? {
            budget: userPrefs.weekly_budget,
            spent: weeklySpent,
            remaining: Math.max(0, userPrefs.weekly_budget - weeklySpent),
            percentage: Math.min(100, Math.round((weeklySpent / userPrefs.weekly_budget) * 100)),
            status:
              weeklySpent >= userPrefs.weekly_budget
                ? 'exceeded'
                : weeklySpent >= userPrefs.weekly_budget * 0.8
                  ? 'warning'
                  : 'safe',
          }
        : null,
      monthly: userPrefs.monthly_budget
        ? {
            budget: userPrefs.monthly_budget,
            spent: monthlySpent,
            remaining: Math.max(0, userPrefs.monthly_budget - monthlySpent),
            percentage: Math.min(100, Math.round((monthlySpent / userPrefs.monthly_budget) * 100)),
            status:
              monthlySpent >= userPrefs.monthly_budget
                ? 'exceeded'
                : monthlySpent >= userPrefs.monthly_budget * 0.8
                  ? 'warning'
                  : 'safe',
          }
        : null,
    };
  }

  // Generate dynamic notification message based on budget status
  generateNotificationMessage(
    budgetData: any,
    type: 'daily' | 'weekly' | 'monthly'
  ): { title: string; body: string } {
    const data = budgetData[type];
    if (!data) {
      return {
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Reminder`,
        body: `Check your ${type} spending progress!`,
      };
    }

    const emoji = type === 'daily' ? '🌙' : type === 'weekly' ? '📊' : '📈';
    let title = `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} Budget`;
    let body = '';

    if (data.status === 'exceeded') {
      title += ' - Exceeded!';
      body = `⚠️ You've exceeded your ${type} budget! Spent $${data.spent.toFixed(2)} of $${data.budget.toFixed(2)}`;
    } else if (data.status === 'warning') {
      title += ' - Warning';
      body = `🔶 You've spent $${data.spent.toFixed(2)} of your $${data.budget.toFixed(2)} ${type} budget (${data.percentage}%)`;
    } else {
      title += ' - On Track';
      if (type === 'daily') {
        body = `💰 You have $${data.remaining.toFixed(2)} remaining in your daily budget. Sleep well!`;
      } else if (type === 'weekly') {
        body = `💰 Weekly budget remaining: $${data.remaining.toFixed(2)} of $${data.budget.toFixed(2)}. Great job!`;
      } else {
        body = `💰 Monthly budget remaining: $${data.remaining.toFixed(2)} of $${data.budget.toFixed(2)}. Keep it up!`;
      }
    }

    return { title, body };
  }

  // Send daily notifications to users in a specific timezone and time
  async sendDailyNotifications(targetTimezone?: string, targetHour?: number): Promise<void> {
    try {
      let query = supabaseAdmin
        .from('user_preferences')
        .select('user_id, push_token, daily_budget, timezone, daily_notification_time')
        .eq('notifications_enabled', true)
        .eq('daily_notifications', true)
        .not('daily_budget', 'is', null)
        .not('push_token', 'is', null);

      // If specific timezone and hour provided (for cron jobs), filter by those
      if (targetTimezone && targetHour !== undefined) {
        const targetMinutes = targetHour * 60; // Convert hour to minutes
        query = query
          .eq('timezone', targetTimezone)
          .gte('daily_notification_time', targetMinutes)
          .lt('daily_notification_time', targetMinutes + 60); // Within the hour
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Failed to fetch users for daily notifications:', error);
        return;
      }

      if (!users || users.length === 0) {
        console.log(
          `No users found for daily notifications${targetTimezone ? ` in ${targetTimezone} at hour ${targetHour}` : ''}`
        );
        return;
      }

      console.log(
        `Checking daily notifications for ${users.length} users${targetTimezone ? ` in ${targetTimezone}` : ''}`
      );

      let sentCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        try {
          // Check if notification was already sent today
          const alreadySent = await this.hasNotificationBeenSentToday(user.user_id, 'daily');

          if (alreadySent) {
            console.log(`Daily notification already sent today for user ${user.user_id}, skipping`);
            skippedCount++;
            continue;
          }

          const progress = await this.calculateSpendingProgress(user.user_id);
          const { title, body } = this.generateNotificationMessage(progress, 'daily');

          const success = await this.sendNotificationToUser(user.push_token, title, body, {
            type: 'daily_budget',
            userId: user.user_id,
            timezone: user.timezone,
          });

          if (success) {
            // Log the notification as sent
            await this.logNotificationSent(
              user.user_id,
              'daily',
              user.timezone,
              user.daily_notification_time
            );
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send daily notification to user ${user.user_id}:`, error);
        }
      }

      console.log(`Daily notifications completed: ${sentCount} sent, ${skippedCount} skipped`);
    } catch (error) {
      console.error('Daily notifications job failed:', error);
    }
  }

  // Send weekly notifications to users in a specific timezone and time
  async sendWeeklyNotifications(targetTimezone?: string, targetHour?: number): Promise<void> {
    try {
      console.log('Starting weekly notifications job...');

      // Build query for timezone-specific notifications
      let query = supabaseAdmin
        .from('user_preferences')
        .select('user_id, push_token, weekly_budget, timezone, weekly_notification_time')
        .eq('notifications_enabled', true)
        .eq('weekly_notifications', true)
        .not('weekly_budget', 'is', null)
        .not('push_token', 'is', null);

      // If specific timezone and hour provided (for cron jobs), filter by those
      if (targetTimezone && targetHour !== undefined) {
        const targetMinutes = targetHour * 60; // Convert hour to minutes
        query = query
          .eq('timezone', targetTimezone)
          .gte('weekly_notification_time', targetMinutes)
          .lt('weekly_notification_time', targetMinutes + 60); // Within the hour
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Failed to fetch users for weekly notifications:', error);
        return;
      }

      if (!users || users.length === 0) {
        console.log(
          `No users found for weekly notifications${targetTimezone ? ` in ${targetTimezone} at hour ${targetHour}` : ''}`
        );
        return;
      }

      console.log(
        `Checking weekly notifications for ${users.length} users${targetTimezone ? ` in ${targetTimezone}` : ''}`
      );

      let sentCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        try {
          const userLocalTime = new Date(
            new Date().toLocaleString('en-US', { timeZone: user.timezone })
          );
          const isSunday = userLocalTime.getDay() === 0;

          if (!isSunday) {
            continue;
          }

          // Check if notification was already sent today
          const alreadySent = await this.hasNotificationBeenSentToday(user.user_id, 'weekly');

          if (alreadySent) {
            console.log(
              `Weekly notification already sent today for user ${user.user_id}, skipping`
            );
            skippedCount++;
            continue;
          }

          const progress = await this.calculateSpendingProgress(user.user_id);
          const { title, body } = this.generateNotificationMessage(progress, 'weekly');

          const success = await this.sendNotificationToUser(user.push_token, title, body, {
            type: 'weekly_budget',
            userId: user.user_id,
            timezone: user.timezone,
          });

          if (success) {
            // Log the notification as sent
            await this.logNotificationSent(
              user.user_id,
              'weekly',
              user.timezone,
              user.weekly_notification_time
            );
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send weekly notification to user ${user.user_id}:`, error);
        }
      }

      console.log(`Weekly notifications completed: ${sentCount} sent, ${skippedCount} skipped`);
    } catch (error) {
      console.error('Weekly notifications job failed:', error);
    }
  }

  // Send monthly notifications to users in a specific timezone and time
  async sendMonthlyNotifications(targetTimezone?: string, targetHour?: number): Promise<void> {
    try {
      console.log('Starting monthly notifications job...');

      // Build query for timezone-specific notifications
      let query = supabaseAdmin
        .from('user_preferences')
        .select('user_id, push_token, monthly_budget, timezone, monthly_notification_time')
        .eq('notifications_enabled', true)
        .eq('monthly_notifications', true)
        .not('monthly_budget', 'is', null)
        .not('push_token', 'is', null);

      // If specific timezone and hour provided (for cron jobs), filter by those
      if (targetTimezone && targetHour !== undefined) {
        const targetMinutes = targetHour * 60; // Convert hour to minutes
        query = query
          .eq('timezone', targetTimezone)
          .gte('monthly_notification_time', targetMinutes)
          .lt('monthly_notification_time', targetMinutes + 60); // Within the hour
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Failed to fetch users for monthly notifications:', error);
        return;
      }

      if (!users || users.length === 0) {
        console.log(
          `No users found for monthly notifications${targetTimezone ? ` in ${targetTimezone} at hour ${targetHour}` : ''}`
        );
        return;
      }

      console.log(
        `Checking monthly notifications for ${users.length} users${targetTimezone ? ` in ${targetTimezone}` : ''}`
      );

      let sentCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        try {
          // Check if it's the 28th in the user's timezone
          const userLocalTime = new Date(
            new Date().toLocaleString('en-US', { timeZone: user.timezone })
          );
          const is28th = userLocalTime.getDate() === 28;

          if (!is28th) {
            continue; // Skip if it's not the 28th in user's timezone
          }

          // Check if notification was already sent today
          const alreadySent = await this.hasNotificationBeenSentToday(user.user_id, 'monthly');

          if (alreadySent) {
            console.log(
              `Monthly notification already sent today for user ${user.user_id}, skipping`
            );
            skippedCount++;
            continue;
          }

          const progress = await this.calculateSpendingProgress(user.user_id);
          const { title, body } = this.generateNotificationMessage(progress, 'monthly');

          const success = await this.sendNotificationToUser(user.push_token, title, body, {
            type: 'monthly_budget',
            userId: user.user_id,
            timezone: user.timezone,
          });

          if (success) {
            // Log the notification as sent
            await this.logNotificationSent(
              user.user_id,
              'monthly',
              user.timezone,
              user.monthly_notification_time
            );
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send monthly notification to user ${user.user_id}:`, error);
        }
      }

      console.log(`Monthly notifications completed: ${sentCount} sent, ${skippedCount} skipped`);
    } catch (error) {
      console.error('Monthly notifications job failed:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
