import Stripe from 'stripe';
import env from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import {
  UserSubscription,
  CreateSubscriptionRequest,
  STRIPE_PRICE_CONFIG,
} from '../types/subscription';
import { subscriptionNotificationService } from './subscriptionNotificationService';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

export class StripeService {
  /**
   * Create or get Stripe customer for user
   */
  async createOrGetCustomer(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<string> {
    try {
      // Check if user already has a customer ID
      const { data: existingSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (existingSubscription?.stripe_customer_id) {
        return existingSubscription.stripe_customer_id;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name: firstName && lastName ? `${firstName} ${lastName}` : '',
        metadata: {
          user_id: userId,
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Failed to create/get Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    userId: string,
    email: string,
    request: CreateSubscriptionRequest,
    firstName?: string,
    lastName?: string
  ): Promise<{ subscription: UserSubscription; clientSecret?: string }> {
    try {
      // Get or create customer
      const customerId = await this.createOrGetCustomer(userId, email, firstName, lastName);

      // Attach payment method to customer
      await stripe.paymentMethods.attach(request.payment_method_id, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: request.payment_method_id,
        },
      });

      // Get price ID for the plan
      const priceConfig = STRIPE_PRICE_CONFIG[request.plan];
      if (!priceConfig) {
        throw new Error(`Invalid subscription plan: ${request.plan}`);
      }

      // Create subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceConfig.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          plan: request.plan,
        },
      });

      const currentPeriodStart = stripeSubscription.items.data[0].current_period_start;
      const currentPeriodEnd = stripeSubscription.items.data[0].current_period_end;

      // Store subscription in database
      const { data: dbSubscription, error } = await supabaseAdmin
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscription.id,
          plan: request.plan,
          status: stripeSubscription.status,
          current_period_start: new Date(currentPeriodStart * 1000),
          current_period_end: new Date(currentPeriodEnd * 1000),
          trial_end: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save subscription to database:', error);
        throw new Error('Failed to save subscription');
      }

      // Update user subscription status
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          subscription_status: stripeSubscription.status,
          subscription_end_date: new Date(currentPeriodEnd * 1000),
        },
      });

      // Get client secret for payment confirmation if needed
      let clientSecret = '';
      const latestInvoice = stripeSubscription.latest_invoice;
      if (latestInvoice && typeof latestInvoice === 'object' && 'payment_intent' in latestInvoice) {
        const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
        clientSecret = paymentIntent.client_secret ?? '';
      }

      return {
        subscription: dbSubscription,
        clientSecret,
      };
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data: subscription, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get user subscription:', error);
        return null;
      }

      return subscription || null;
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    userId: string,
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<UserSubscription> {
    try {
      // Cancel subscription in Stripe
      let stripeSubscription;
      if (cancelAtPeriodEnd) {
        stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        stripeSubscription = await stripe.subscriptions.cancel(subscriptionId);
      }

      // Update subscription in database
      const updateData: any = {
        status: stripeSubscription.status,
        cancelled_at: new Date(),
        updated_at: new Date(),
      };

      if (!cancelAtPeriodEnd) {
        updateData.current_period_end = new Date();
      }

      const { data: updatedSubscription, error } = await supabaseAdmin
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', userId)
        .eq('stripe_subscription_id', subscriptionId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update subscription in database:', error);
        throw new Error('Failed to update subscription');
      }

      // Update user subscription status
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          subscription_status: stripeSubscription.status,
        },
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      // Get user's customer ID
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      // Attach new payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: subscription.stripe_customer_id,
      });

      // Set as default payment method
      await stripe.customers.update(subscription.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update subscription default payment method
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        default_payment_method: paymentMethodId,
      });
    } catch (error) {
      console.error('Failed to update payment method:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.upcoming':
          await this.handleUpcomingInvoice(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to handle webhook event:', error);
      throw error;
    }
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.user_id;
      if (!userId) {
        console.error('No user_id in subscription metadata');
        return;
      }

      const currentPeriodStart = subscription.items.data[0].current_period_start;
      const currentPeriodEnd = subscription.items.data[0].current_period_end;
      const plan = subscription.metadata.plan || 'monthly';

      // Update subscription in database
      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(currentPeriodStart * 1000),
          current_period_end: new Date(currentPeriodEnd * 1000),
          cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          updated_at: new Date(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription:', error);
        return;
      }

      // Update user subscription status in auth metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          subscription_status: subscription.status,
          subscription_end_date: new Date(currentPeriodEnd * 1000),
        },
      });

      // Send appropriate notifications based on subscription status
      if (subscription.status === 'active' && !subscription.canceled_at) {
        // New active subscription or reactivated
        await subscriptionNotificationService.sendSubscriptionWelcome(userId, plan as any);
      } else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
        // Subscription cancelled
        await subscriptionNotificationService.sendSubscriptionCancelled(
          userId,
          plan as any,
          new Date(currentPeriodEnd * 1000)
        );
      } else if (subscription.status === 'active' && subscription.canceled_at) {
        // Subscription reactivated after cancellation
        await subscriptionNotificationService.sendSubscriptionReactivated(userId, plan as any);
      }

      console.log(
        `Updated subscription ${subscription.id} for user ${userId}: ${subscription.status}`
      );
    } catch (error) {
      console.error('Failed to handle subscription change:', error);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      console.log(`Payment succeeded for invoice: ${invoice.id}`);

      // @ts-ignore - Stripe types might not include subscription property in all contexts
      if (invoice.subscription && typeof invoice.subscription === 'string') {
        // @ts-ignore
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata.user_id;
        const plan = subscription.metadata.plan || 'monthly';

        // Send payment success notification
        if (userId && invoice.amount_paid) {
          await subscriptionNotificationService.sendPaymentSuccess(
            userId,
            invoice.amount_paid,
            plan as any
          );
        }

        // Refresh subscription status after successful payment
        await this.handleSubscriptionChange(subscription);
      }
    } catch (error) {
      console.error('Failed to handle payment success:', error);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      console.log(`Payment failed for invoice: ${invoice.id}`);

      // @ts-ignore - Stripe types might not include subscription property in all contexts
      if (invoice.subscription && typeof invoice.subscription === 'string') {
        // @ts-ignore
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata.user_id;
        const plan = subscription.metadata.plan || 'monthly';

        if (userId) {
          // Send payment failed notification
          await subscriptionNotificationService.sendPaymentFailed(userId, plan as any);
        }

        // Update subscription status after payment failure
        await this.handleSubscriptionChange(subscription);
      }
    } catch (error) {
      console.error('Failed to handle payment failure:', error);
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.user_id;

      if (userId && subscription.trial_end) {
        // Calculate days left in trial
        const trialEndDate = new Date(subscription.trial_end * 1000);
        const now = new Date();
        const daysLeft = Math.ceil(
          (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send trial ending notification
        if (daysLeft > 0) {
          await subscriptionNotificationService.sendTrialEndingSoon(userId, daysLeft);
        }
      }
    } catch (error) {
      console.error('Failed to handle trial will end:', error);
    }
  }

  private async handleUpcomingInvoice(invoice: Stripe.Invoice): Promise<void> {
    try {
      console.log(`Upcoming invoice: ${invoice.id}`);

      // @ts-ignore - Stripe types might not include subscription property in all contexts
      if (invoice.subscription && typeof invoice.subscription === 'string') {
        // @ts-ignore
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata.user_id;
        const plan = subscription.metadata.plan || 'monthly';

        if (userId && invoice.next_payment_attempt) {
          // Send renewal reminder notification
          const renewalDate = new Date(invoice.next_payment_attempt * 1000);
          await subscriptionNotificationService.sendRenewalReminder(
            userId,
            plan as any,
            renewalDate
          );
        }
      }
    } catch (error) {
      console.error('Failed to handle upcoming invoice:', error);
    }
  }

  /**
   * Sync subscription status from Stripe (fallback method)
   */
  async syncSubscriptionStatus(userId: string): Promise<UserSubscription | null> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return null;
      }

      // Get latest status from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Update using the same method as webhook
      await this.handleSubscriptionChange(stripeSubscription);

      // Return updated subscription
      return await this.getUserSubscription(userId);
    } catch (error) {
      console.error('Failed to sync subscription status:', error);
      return null;
    }
  }
}

export const stripeService = new StripeService();
