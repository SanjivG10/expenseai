// Subscription and payment types for ExpenseAI with RevenueCat
import type { CustomerInfo, PurchasesStoreProduct } from 'react-native-purchases';

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  interval: string;
  intervalCount: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  // Removed Stripe IDs - using IAP only
  // IAP product IDs
  iosProductId: string;
  androidProductId: string;
  savings?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  // RevenueCat specific fields
  revenuecat_user_id: string;
  entitlement_id: string;
  product_id: string;
  store: 'app_store' | 'play_store';
  // Common fields
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response types for RevenueCat
export interface RevenueCatWebhookRequest {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    store: string;
    environment: 'SANDBOX' | 'PRODUCTION';
  };
}

export interface CreateSubscriptionResponse {
  success: boolean;
  message: string;
  data?: {
    subscription: UserSubscription;
    customer_info?: CustomerInfo;
  };
}

export interface GetSubscriptionResponse {
  success: boolean;
  message: string;
  data?: UserSubscription;
}

export interface CancelSubscriptionRequest {
  subscription_id: string;
  cancel_at_period_end?: boolean;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  data?: UserSubscription;
}

export interface UpdatePaymentMethodRequest {
  payment_method_id: string;
}

export interface UpdatePaymentMethodResponse {
  success: boolean;
  message: string;
}

// RevenueCat specific types
export interface RevenueCatSubscription extends PurchasesStoreProduct {
  // Extended with any additional properties we need
}

export interface RestorePurchasesResponse {
  success: boolean;
  message: string;
  data?: {
    customer_info: CustomerInfo;
    has_active_subscription: boolean;
  };
}

// Payment intent types for one-time payments (if needed)
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  message: string;
  data?: {
    client_secret: string;
    payment_intent_id: string;
  };
}

// Pricing configuration
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Plan',
    price: 3.0,
    currency: 'USD',
    interval: 'week',
    intervalCount: 1,
    description: 'Perfect for trying out ExpenseAI',
    features: [
      'No ads',
      'AI-powered receipt scanning',
      'Voice expense entry',
      'Unlimited expense tracking',
    ],
    // Removed Stripe IDs - using IAP only
    iosProductId: 'com.expenseai.weekly',
    androidProductId: 'weekly_subscription',
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 8.0,
    originalPrice: 13.0,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
    description: 'Most popular choice for regular users',
    features: [
      'No ads',
      'AI-powered receipt scanning',
      'Voice expense entry',
      'Unlimited expense tracking',
    ],
    isPopular: true,
    savings: 'Save 38%',
    // Removed Stripe IDs - using IAP only
    iosProductId: 'com.expenseai.monthly',
    androidProductId: 'monthly_subscription',
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 50.0,
    originalPrice: 156.0,
    currency: 'USD',
    interval: 'year',
    intervalCount: 1,
    description: 'Best value for committed users',
    features: [
      'No ads',
      'AI-powered receipt scanning',
      'Voice expense entry',
      'Unlimited expense tracking',
    ],
    savings: 'Save 68%',
    // Removed Stripe IDs - using IAP only
    iosProductId: 'com.expenseai.yearly',
    androidProductId: 'yearly_subscription',
  },
];

// Helper functions
export const getPlanById = (planId: SubscriptionPlan): PricingPlan | undefined => {
  return PRICING_PLANS.find((plan) => plan.id === planId);
};

export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

export const getMonthlyEquivalent = (plan: PricingPlan): number => {
  switch (plan.interval) {
    case 'week':
      return plan.price * 4.33; // Average weeks per month
    case 'month':
      return plan.price;
    case 'year':
      return plan.price / 12;
    default:
      return plan.price;
  }
};

export const isSubscriptionActive = (subscription: UserSubscription): boolean => {
  return ['active', 'trialing'].includes(subscription.status);
};

export const getSubscriptionEndDate = (subscription: UserSubscription): Date => {
  return new Date(subscription.current_period_end);
};

export const isSubscriptionExpired = (subscription: UserSubscription): boolean => {
  const endDate = getSubscriptionEndDate(subscription);
  return endDate < new Date();
};
