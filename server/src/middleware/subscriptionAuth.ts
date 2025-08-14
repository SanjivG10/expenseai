import { Request, Response, NextFunction } from 'express';
import { iapService } from '../services/iapService';

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

    // Get IAP subscription (mobile only)
    try {
      subscription = await iapService.getActiveSubscription(userId);
    } catch (error) {
      console.log('No IAP subscription found');
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