import { initStripe, createPaymentMethod, confirmPayment } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { apiService } from './api';
import {
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  SubscriptionPlan,
  UserSubscription,
  GetSubscriptionResponse,
  CancelSubscriptionResponse,
  CancelSubscriptionRequest,
  UpdatePaymentMethodRequest,
  UpdatePaymentMethodResponse,
} from '../types/subscription';
import { ENV } from '../constants/envs';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = ENV.STRIPE_PUBLISHABLE_KEY;

class StripeService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await initStripe({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        urlScheme: 'expenseai',
      });

      this.isInitialized = true;
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw new Error('Payment system initialization failed');
    }
  }

  /**
   * Create a subscription for the user
   */
  async createSubscription(plan: SubscriptionPlan): Promise<UserSubscription | null> {
    try {
      // Create payment method
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (paymentMethodError) {
        console.error('Payment method creation failed:', paymentMethodError);
        Alert.alert('Payment Error', paymentMethodError.message);
        return null;
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Create subscription on backend
      const subscriptionRequest: CreateSubscriptionRequest = {
        plan,
        payment_method_id: paymentMethod.id,
      };

      const response: CreateSubscriptionResponse =
        await apiService.createSubscription(subscriptionRequest);

      if (!response.success) {
        Alert.alert('Subscription Error', response.message);
        return null;
      }

      // If client secret is provided, confirm the payment
      if (response.data?.client_secret) {
        const { error: confirmError } = await confirmPayment(response.data.client_secret, {
          paymentMethodType: 'Card',
        });

        if (confirmError) {
          console.error('Payment confirmation failed:', confirmError);
          Alert.alert('Payment Error', confirmError.message);
          return null;
        }
      }

      Alert.alert(
        'Subscription Created!',
        `Welcome to ExpenseAI ${plan} plan! Your subscription is now active.`,
        [{ text: 'OK' }]
      );

      return response.data?.subscription || null;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
      return null;
    }
  }

  /**
   * Get current user subscription
   */
  async getUserSubscription(): Promise<UserSubscription | null> {
    try {
      const response: GetSubscriptionResponse = await apiService.getUserSubscription();
      return response.data || null;
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      return null;
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<boolean> {
    try {
      const request: CancelSubscriptionRequest = {
        subscription_id: subscriptionId,
        cancel_at_period_end: cancelAtPeriodEnd,
      };

      const response: CancelSubscriptionResponse = await apiService.cancelSubscription(request);

      if (response.success) {
        Alert.alert(
          'Subscription Cancelled',
          cancelAtPeriodEnd
            ? 'Your subscription will be cancelled at the end of the current billing period.'
            : 'Your subscription has been cancelled immediately.',
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert('Cancellation Error', response.message);
        return false;
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
      return false;
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(): Promise<boolean> {
    try {
      // Create new payment method
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (paymentMethodError) {
        console.error('Payment method creation failed:', paymentMethodError);
        Alert.alert('Payment Error', paymentMethodError.message);
        return false;
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Update payment method on backend
      const request: UpdatePaymentMethodRequest = {
        payment_method_id: paymentMethod.id,
      };

      const response: UpdatePaymentMethodResponse = await apiService.updatePaymentMethod(request);

      if (response.success) {
        Alert.alert('Payment Method Updated', 'Your payment method has been successfully updated.');
        return true;
      } else {
        Alert.alert('Update Error', response.message);
        return false;
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
      Alert.alert('Error', 'Failed to update payment method. Please try again.');
      return false;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription();
      return subscription ? ['active', 'trialing'].includes(subscription.status) : false;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get subscription status for display
   */
  getSubscriptionStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial Period';
      case 'past_due':
        return 'Payment Due';
      case 'cancelled':
        return 'Cancelled';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format subscription renewal date
   */
  formatRenewalDate(subscription: UserSubscription): string {
    const renewalDate = new Date(subscription.current_period_end);
    return renewalDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export const stripeService = new StripeService();
export default stripeService;
