// Subscription types for backend

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at?: Date;
  trial_end?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionRequest {
  plan: SubscriptionPlan;
  payment_method_id: string;
}

export interface CreateSubscriptionResponse {
  subscription: UserSubscription;
  client_secret?: string;
}

export interface CancelSubscriptionRequest {
  subscription_id: string;
  cancel_at_period_end?: boolean;
}

export interface UpdatePaymentMethodRequest {
  payment_method_id: string;
}

// Stripe product and price configurations
export const STRIPE_PRICE_CONFIG = {
  weekly: {
    productId: 'prod_weekly_expenseai',
    priceId: 'price_weekly_expenseai',
    price: 500, // $5.00 in cents
  },
  monthly: {
    productId: 'prod_monthly_expenseai', 
    priceId: 'price_monthly_expenseai',
    price: 1600, // $16.00 in cents
  },
  yearly: {
    productId: 'prod_yearly_expenseai',
    priceId: 'price_yearly_expenseai', 
    price: 16000, // $160.00 in cents
  },
} as const;