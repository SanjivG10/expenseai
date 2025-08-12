import { supabaseAdmin } from '../config/supabase';
import { SubscriptionPlan } from '../types/subscription';
import { pushNotificationService } from './pushNotificationService';

export class SubscriptionNotificationService {
  /**
   * Send subscription welcome notification
   */
  async sendSubscriptionWelcome(userId: string, plan: SubscriptionPlan): Promise<void> {
    try {
      const { title, body } = this.getWelcomeMessage(plan);
      await this.sendNotificationToUser(userId, title, body, {
        type: 'subscription_welcome',
        plan,
      });
    } catch (error) {
      console.error('Failed to send subscription welcome notification:', error);
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(userId: string, amount: number, plan: SubscriptionPlan): Promise<void> {
    try {
      const title = '💳 Payment Successful';
      const body = `Your ${plan} subscription payment of $${(amount / 100).toFixed(2)} was processed successfully!`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'payment_success',
        plan,
        amount,
      });
    } catch (error) {
      console.error('Failed to send payment success notification:', error);
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailed(userId: string, plan: SubscriptionPlan): Promise<void> {
    try {
      const title = '⚠️ Payment Failed';
      const body = `We couldn't process your ${plan} subscription payment. Please update your payment method to continue using ExpenseAI Premium.`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'payment_failed',
        plan,
        action_required: true,
      });
    } catch (error) {
      console.error('Failed to send payment failed notification:', error);
    }
  }

  /**
   * Send subscription cancelled notification
   */
  async sendSubscriptionCancelled(
    userId: string,
    plan: SubscriptionPlan,
    endDate: Date
  ): Promise<void> {
    try {
      const title = '📅 Subscription Cancelled';
      const endDateStr = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const body = `Your ${plan} subscription has been cancelled and will end on ${endDateStr}. You'll keep access until then.`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'subscription_cancelled',
        plan,
        end_date: endDate.toISOString(),
      });
    } catch (error) {
      console.error('Failed to send subscription cancelled notification:', error);
    }
  }

  /**
   * Send subscription reactivated notification
   */
  async sendSubscriptionReactivated(userId: string, plan: SubscriptionPlan): Promise<void> {
    try {
      const title = '🎉 Subscription Reactivated';
      const body = `Welcome back! Your ${plan} subscription is now active again. Enjoy all premium features!`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'subscription_reactivated',
        plan,
      });
    } catch (error) {
      console.error('Failed to send subscription reactivated notification:', error);
    }
  }

  /**
   * Send trial ending soon notification
   */
  async sendTrialEndingSoon(userId: string, daysLeft: number): Promise<void> {
    try {
      const title = '⏰ Trial Ending Soon';
      const body =
        daysLeft === 1
          ? 'Your free trial ends tomorrow! Subscribe now to keep using ExpenseAI Premium features.'
          : `Your free trial ends in ${daysLeft} days. Subscribe now to continue enjoying premium features!`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'trial_ending',
        days_left: daysLeft,
        action_required: true,
      });
    } catch (error) {
      console.error('Failed to send trial ending notification:', error);
    }
  }

  /**
   * Send subscription expired notification
   */
  async sendSubscriptionExpired(userId: string, plan: SubscriptionPlan): Promise<void> {
    try {
      const title = '😔 Subscription Expired';
      const body = `Your ${plan} subscription has expired. Subscribe again to restore access to premium features like unlimited AI scanning and advanced analytics.`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'subscription_expired',
        plan,
        action_required: true,
      });
    } catch (error) {
      console.error('Failed to send subscription expired notification:', error);
    }
  }

  /**
   * Send subscription renewal reminder
   */
  async sendRenewalReminder(
    userId: string,
    plan: SubscriptionPlan,
    renewalDate: Date
  ): Promise<void> {
    try {
      const title = '🔄 Subscription Renewing Soon';
      const renewalDateStr = renewalDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const body = `Your ${plan} subscription will renew on ${renewalDateStr}. Make sure your payment method is up to date!`;

      await this.sendNotificationToUser(userId, title, body, {
        type: 'renewal_reminder',
        plan,
        renewal_date: renewalDate.toISOString(),
      });
    } catch (error) {
      console.error('Failed to send renewal reminder notification:', error);
    }
  }

  /**
   * Helper method to send notification to user
   */
  private async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user's push token from database
      const { data: userPrefs, error } = await supabaseAdmin
        .from('user_preferences')
        .select('push_token, notifications_enabled')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Failed to get user preferences for notification:', error);
        return;
      }

      if (!userPrefs?.notifications_enabled || !userPrefs?.push_token) {
        console.log(`User ${userId} has notifications disabled or no push token`);
        return;
      }

      // Send push notification
      const success = await pushNotificationService.sendNotificationToUser(
        userPrefs.push_token,
        title,
        body,
        {
          ...data,
          userId,
          timestamp: new Date().toISOString(),
        }
      );

      if (success) {
        console.log(`Subscription notification sent to user ${userId}: ${title}`);
      } else {
        console.error(`Failed to send subscription notification to user ${userId}`);
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  /**
   * Get welcome message based on plan
   */
  private getWelcomeMessage(plan: SubscriptionPlan): { title: string; body: string } {
    const planNames = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };

    return {
      title: `Welcome to ExpenseAI ${planNames[plan]}!`,
      body: `Your subscription is now active! Let's start tracking your expenses smarter!`,
    };
  }
}

export const subscriptionNotificationService = new SubscriptionNotificationService();
