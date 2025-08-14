import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
import env from '../config/env';

// RevenueCat webhook validation schema
const revenueCatWebhookSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string(),
    product_id: z.string(),
    period_type: z.string().optional(),
    purchased_at_ms: z.number(),
    expiration_at_ms: z.number().optional(),
    store: z.enum(['APP_STORE', 'PLAY_STORE', 'AMAZON', 'MAC_APP_STORE']),
    environment: z.enum(['SANDBOX', 'PRODUCTION']),
    presented_offering_identifier: z.string().optional(),
    transaction_id: z.string().optional(),
    original_transaction_id: z.string().optional(),
  }),
});

export class RevenueCatController {
  /**
   * Handle RevenueCat webhooks
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook signature if configured
      if (env.REVENUECAT_WEBHOOK_SECRET) {
        const signature = req.headers['x-revenuecat-signature'] as string;
        if (!this.verifyWebhookSignature(req.body, signature)) {
          res.status(401).json({ error: 'Invalid webhook signature' });
          return;
        }
      }

      // Validate webhook payload
      const validationResult = revenueCatWebhookSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error('Invalid webhook payload:', validationResult.error);
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      const { event } = validationResult.data;

      // Process the webhook event
      await this.processWebhookEvent(event);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('RevenueCat webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Get subscription status from local database
   */
  async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get user's RevenueCat user ID from auth metadata
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const revenueCatUserId = userData.user.user_metadata?.revenuecat_user_id || userId;

      // Get user's active subscription from database using RevenueCat user ID
      const { data: subscription, error } = await supabaseAdmin
        .from('revenuecat_subscriptions')
        .select('*')
        .eq('revenuecat_user_id', revenueCatUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get subscription:', error);
        throw new Error('Failed to retrieve subscription');
      }

      res.json({
        success: true,
        message: 'Subscription status retrieved successfully',
        data: subscription || null,
      });
    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subscription status',
      });
    }
  }

  /**
   * Cancel subscription (mark as cancelled in database)
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

      // Get user's RevenueCat user ID from auth metadata
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const revenueCatUserId = userData.user.user_metadata?.revenuecat_user_id || userId;

      // Update subscription status in database using RevenueCat user ID
      const { data: subscription, error } = await supabaseAdmin
        .from('revenuecat_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('revenuecat_user_id', revenueCatUserId)
        .eq('status', 'active')
        .select()
        .single();

      if (error) {
        console.error('Failed to cancel subscription:', error);
        res.status(400).json({
          success: false,
          message: 'Failed to cancel subscription',
        });
        return;
      }

      res.json({
        success: true,
        message:
          'Subscription cancelled successfully. Manage your subscription in the App Store or Google Play.',
        data: subscription,
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
   * Process RevenueCat webhook events
   */
  private async processWebhookEvent(event: any): Promise<void> {
    const { type, app_user_id } = event;

    console.log(`Processing RevenueCat event: ${type} for user: ${app_user_id}`);

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        await this.handleSubscriptionActive(event);
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        await this.handleSubscriptionCancelled(event);
        break;

      case 'UNCANCELLATION':
        await this.handleSubscriptionUncancelled(event);
        break;

      case 'NON_RENEWING_PURCHASE':
        // Handle one-time purchases if needed
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }
  }

  /**
   * Handle active subscription events
   */
  private async handleSubscriptionActive(event: any): Promise<void> {
    const {
      app_user_id,
      product_id,
      store,
      purchased_at_ms,
      expiration_at_ms,
      transaction_id,
      original_transaction_id,
    } = event;

    // Extract plan from product_id
    const plan = this.extractPlanFromProductId(product_id);

    // Convert timestamps
    const purchasedAt = new Date(purchased_at_ms);
    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;

    try {
      // Find the auth user by RevenueCat user ID in metadata
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(app_user_id);

      if (authError || !authUser.user) {
        console.error(`Auth user not found for RevenueCat user ID: ${app_user_id}`, authError);
        return;
      }

      const userId = authUser.user.id;

      // Upsert subscription
      const { error } = await supabaseAdmin.from('revenuecat_subscriptions').upsert(
        {
          user_id: userId,
          revenuecat_user_id: app_user_id,
          entitlement_id: 'premium',
          product_id,
          store: store === 'APP_STORE' ? 'app_store' : 'play_store',
          plan,
          status: 'active',
          current_period_start: purchasedAt.toISOString(),
          current_period_end:
            expiresAt?.toISOString() ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          transaction_id,
          original_transaction_id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,revenuecat_user_id',
        }
      );

      if (error) {
        console.error('Failed to upsert subscription:', error);
      } else {
        console.log(`✅ Subscription activated for user: ${userId}`);
      }
    } catch (error) {
      console.error('Error handling subscription active:', error);
    }
  }

  /**
   * Handle subscription cancellation/expiration
   */
  private async handleSubscriptionCancelled(event: any): Promise<void> {
    const { app_user_id } = event;

    try {
      const { error } = await supabaseAdmin
        .from('revenuecat_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('revenuecat_user_id', app_user_id)
        .eq('status', 'active');

      if (error) {
        console.error('Failed to cancel subscription:', error);
      } else {
        console.log(`✅ Subscription cancelled for RevenueCat user: ${app_user_id}`);
      }
    } catch (error) {
      console.error('Error handling subscription cancelled:', error);
    }
  }

  /**
   * Handle subscription uncancellation (user resumed subscription)
   */
  private async handleSubscriptionUncancelled(event: any): Promise<void> {
    const { app_user_id, expiration_at_ms } = event;

    try {
      const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;

      const { error } = await supabaseAdmin
        .from('revenuecat_subscriptions')
        .update({
          status: 'active',
          cancelled_at: null,
          current_period_end: expiresAt?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('revenuecat_user_id', app_user_id);

      if (error) {
        console.error('Failed to uncancel subscription:', error);
      } else {
        console.log(`✅ Subscription uncancelled for RevenueCat user: ${app_user_id}`);
      }
    } catch (error) {
      console.error('Error handling subscription uncancelled:', error);
    }
  }

  /**
   * Extract subscription plan from product ID
   */
  private extractPlanFromProductId(productId: string): string {
    if (productId.includes('weekly')) return 'weekly';
    if (productId.includes('monthly')) return 'monthly';
    if (productId.includes('yearly')) return 'yearly';
    return 'monthly';
  }

  /**
   * Verify webhook signature (optional but recommended)
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!env.REVENUECAT_WEBHOOK_SECRET || !signature) {
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', env.REVENUECAT_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

export const revenueCatController = new RevenueCatController();
