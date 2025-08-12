import env from '../config/env';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { stripeService } from '../services/stripeService';

// Validation schemas
const createSubscriptionSchema = z.object({
  plan: z.enum(['weekly', 'monthly', 'yearly']),
  payment_method_id: z.string().min(1),
});

const cancelSubscriptionSchema = z.object({
  subscription_id: z.string().min(1),
  cancel_at_period_end: z.boolean().optional().default(true),
});

const updatePaymentMethodSchema = z.object({
  payment_method_id: z.string().min(1),
});

export class SubscriptionController {
  /**
   * Create a new subscription
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Validate request body
      const validationResult = createSubscriptionSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        });
        return;
      }

      const { plan, payment_method_id } = validationResult.data;

      // Get user details
      const user = req.user;
      if (!user?.email) {
        res.status(400).json({
          success: false,
          message: 'User email not found',
        });
        return;
      }

      // Create subscription
      const result = await stripeService.createSubscription(
        userId,
        user.email,
        { plan, payment_method_id },
        user.firstName,
        user.lastName
      );

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: result,
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
      });
    }
  }

  /**
   * Get user's current subscription (with sync from Stripe)
   */
  async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Sync with Stripe to get latest status
      const subscription = await stripeService.syncSubscriptionStatus(userId);

      if (!subscription) {
        res.status(404).json({
          success: false,
          message: 'No subscription found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Subscription retrieved successfully',
        data: subscription,
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subscription',
      });
    }
  }

  /**
   * Cancel user's subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Validate request body
      const validationResult = cancelSubscriptionSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        });
        return;
      }

      const { subscription_id, cancel_at_period_end } = validationResult.data;

      // Cancel subscription
      const updatedSubscription = await stripeService.cancelSubscription(
        userId,
        subscription_id,
        cancel_at_period_end
      );

      res.json({
        success: true,
        message: cancel_at_period_end
          ? 'Subscription will be cancelled at end of period'
          : 'Subscription cancelled immediately',
        data: updatedSubscription,
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
      });
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Validate request body
      const validationResult = updatePaymentMethodSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        });
        return;
      }

      const { payment_method_id } = validationResult.data;

      // Update payment method
      await stripeService.updatePaymentMethod(userId, payment_method_id);

      res.json({
        success: true,
        message: 'Payment method updated successfully',
      });
    } catch (error) {
      console.error('Update payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment method',
      });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.error('Stripe webhook secret not configured');
        res.status(400).json({ error: 'Webhook secret not configured' });
        return;
      }

      let event: any;

      try {
        // Verify the webhook signature
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-07-30.basil',
        });
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }

      // Process the event
      await stripeService.handleWebhookEvent(event);

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
}

export const subscriptionController = new SubscriptionController();
