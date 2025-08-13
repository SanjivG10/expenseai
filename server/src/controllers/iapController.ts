import { Request, Response } from 'express';
import { z } from 'zod';
import { iapService } from '../services/iapService';
import { supabaseAdmin } from '../config/supabase';

// Validation schemas
const verifyPurchaseSchema = z.object({
  receipt: z.object({
    transactionId: z.string(),
    productId: z.string(),
    transactionDate: z.union([z.string(), z.number()]).optional(),
    transactionReceipt: z.string().optional(),
    purchaseToken: z.string().optional(),
    originalTransactionIdentifierIOS: z.string().optional(),
    transactionReceiptIOS: z.string().optional(),
    purchaseTokenAndroid: z.string().optional(),
    dataAndroid: z.string().optional(),
    signatureAndroid: z.string().optional(),
  }),
  platform: z.enum(['ios', 'android']),
});

export class IAPController {
  /**
   * Verify purchase receipt with Apple/Google
   */
  async verifyPurchase(req: Request, res: Response): Promise<void> {
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
      const validationResult = verifyPurchaseSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        });
        return;
      }

      const { receipt, platform } = validationResult.data;

      const verificationResult = await iapService.verifyReceipt(receipt, platform);

      if (!verificationResult.isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid receipt',
        });
        return;
      }

      const subscription = await iapService.createOrUpdateSubscription(
        userId,
        receipt,
        platform,
        verificationResult
      );

      res.json({
        success: true,
        message: 'Purchase verified successfully',
        data: {
          subscription,
          verified: true,
        },
      });
    } catch (error) {
      console.error('Verify purchase error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify purchase',
      });
    }
  }

  /**
   * Restore user's previous purchases
   */
  async restorePurchases(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get user's existing subscriptions from database
      const { data: subscriptions, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get user subscriptions:', error);
        throw new Error('Failed to retrieve subscriptions');
      }

      // Filter active subscriptions
      const activeSubscriptions =
        subscriptions?.filter(
          (sub) => sub.status === 'active' && new Date(sub.current_period_end) > new Date()
        ) || [];

      res.json({
        success: true,
        message: 'Purchases restored successfully',
        data: {
          subscriptions: activeSubscriptions,
          restored: activeSubscriptions.length > 0,
        },
      });
    } catch (error) {
      console.error('Restore purchases error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore purchases',
      });
    }
  }

  /**
   * Get user's current IAP subscription status
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

      // Get user's active subscription
      const { data: subscription, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
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
   * Cancel IAP subscription
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

      // Update subscription status in database
      const { data: subscription, error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
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
        message: 'Subscription cancelled successfully',
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
}

export const iapController = new IAPController();
