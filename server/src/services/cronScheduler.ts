import * as cron from 'node-cron';
import { pushNotificationService } from './pushNotificationService';

export class CronScheduler {
  private notificationJob?: cron.ScheduledTask | null;

  // Start timezone-aware notification system
  start(): void {
    console.log('Starting timezone-aware notification cron jobs...');

    this.startNotificationCheck();

    console.log('Timezone-aware notification system started successfully');
  }

  // Stop all cron jobs
  stop(): void {
    console.log('Stopping notification cron jobs...');

    if (this.notificationJob) {
      this.notificationJob.stop();
      this.notificationJob = null;
    }

    console.log('All notification cron jobs stopped');
  }

  // Run notification checks every 15 minutes for all timezones
  private startNotificationCheck(): void {
    this.notificationJob = cron.schedule(
      '*/15 * * * *', // Every 15 minutes
      async () => {
        console.log('Running notification check...');
        try {
          await this.checkAndSendNotifications();
        } catch (error) {
          console.error('Notification check failed:', error);
        }
      },
      {
        timezone: 'UTC', // Run in UTC for consistency
      }
    );

    console.log('Notification check scheduled every 15 minutes');
  }

  // Check all timezones and send notifications if needed
  private async checkAndSendNotifications(): Promise<void> {
    try {
      // Send all notification types - let the service handle timezone filtering
      // The service will check each user's local time for weekly/monthly notifications
      await pushNotificationService.sendDailyNotifications();
      await pushNotificationService.sendWeeklyNotifications();
      await pushNotificationService.sendMonthlyNotifications();
    } catch (error) {
      console.error('Failed to process notifications:', error);
    }
  }

  // Test methods for immediate execution (send to all users regardless of timezone)
  async testDailyNotifications(): Promise<void> {
    console.log('Testing daily notifications...');
    await pushNotificationService.sendDailyNotifications(); // No timezone filter for testing
  }

  async testWeeklyNotifications(): Promise<void> {
    console.log('Testing weekly notifications...');
    await pushNotificationService.sendWeeklyNotifications(); // No timezone filter for testing
  }

  async testMonthlyNotifications(): Promise<void> {
    console.log('Testing monthly notifications...');
    await pushNotificationService.sendMonthlyNotifications(); // No timezone filter for testing
  }
}

export const cronScheduler = new CronScheduler();
