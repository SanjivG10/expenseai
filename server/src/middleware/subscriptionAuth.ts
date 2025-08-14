import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface SubscriptionRequest extends Request {
  user?: any;
  subscription?: any;
  hasActiveSubscription?: boolean;
}

/**
 * Middleware to check if user has an active subscription
 * Sets req.hasActiveSubscription and req.subscription
 */
export const checkSubscription = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      req.hasActiveSubscription = false;
      req.subscription = null;
      next();
      return;
    }

    let subscription = null;

    // Get RevenueCat subscription from database
    try {
      // Get user's RevenueCat user ID from auth metadata
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.log('User not found for subscription check:', userId);
        req.hasActiveSubscription = false;
        req.subscription = null;
        next();
        return;
      }

      const revenueCatUserId = userData.user.user_metadata?.revenuecat_user_id || userId;

      const { data: revenueCatSubscription, error } = await supabaseAdmin
        .from('revenuecat_subscriptions')
        .select('*')
        .eq('revenuecat_user_id', revenueCatUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && revenueCatSubscription) {
        // Check if subscription hasn't expired
        const endDate = new Date(revenueCatSubscription.current_period_end);
        if (endDate > new Date()) {
          subscription = revenueCatSubscription;
        } else {
          // Mark expired subscription as cancelled
          await supabaseAdmin
            .from('revenuecat_subscriptions')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', revenueCatSubscription.id);
        }
      }
    } catch (error) {
      console.log('No RevenueCat subscription found:', error);
    }

    // Check if subscription is active
    const isActive = subscription && ['active', 'trialing'].includes(subscription.status);
    
    req.hasActiveSubscription = isActive;
    req.subscription = subscription;
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    // Don't block the request on subscription check errors
    req.hasActiveSubscription = false;
    req.subscription = null;
    next();
  }
};

/**
 * Middleware to require active subscription
 * Returns 403 if user doesn't have active subscription
 */
export const requireActiveSubscription = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First run subscription check if not already done
  if (req.hasActiveSubscription === undefined) {
    await checkSubscription(req, res, () => {});
  }

  if (!req.hasActiveSubscription) {
    res.status(403).json({
      success: false,
      message: 'Active subscription required to access this feature',
      code: 'SUBSCRIPTION_REQUIRED',
      data: {
        hasSubscription: false,
        subscriptionStatus: req.subscription?.status || 'none'
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to optionally check subscription
 * Similar to checkSubscription but doesn't set req properties
 * Returns subscription info in response for client to decide
 */
export const optionalSubscriptionCheck = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await checkSubscription(req, res, next);
};

// Alias for backward compatibility
export const subscriptionAuth = requireActiveSubscription;