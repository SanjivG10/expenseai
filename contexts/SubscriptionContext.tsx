import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { stripeService } from '../services/stripeService';
import { UserSubscription, isSubscriptionActive } from '../types/subscription';

interface SubscriptionState {
  subscription: UserSubscription | null;
  isActive: boolean;
  isLoading: boolean;
  hasTrialExpired: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  cancelSubscription: (subscriptionId: string, cancelAtPeriodEnd?: boolean) => Promise<boolean>;
  isSubscribed: () => boolean;
  canAccessPremiumFeatures: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    subscription: null,
    isActive: false,
    isLoading: true,
    hasTrialExpired: false,
  });

  // Load subscription on mount
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setSubscriptionState((prev) => ({ ...prev, isLoading: true }));

      const subscription = await stripeService.getUserSubscription();

      if (subscription) {
        const isActive = isSubscriptionActive(subscription);
        const hasTrialExpired = Boolean(
          subscription.status === 'past_due' ||
            (subscription.trial_end && new Date(subscription.trial_end) < new Date())
        );

        setSubscriptionState({
          subscription,
          isActive,
          isLoading: false,
          hasTrialExpired,
        });
      } else {
        setSubscriptionState({
          subscription: null,
          isActive: false,
          isLoading: false,
          hasTrialExpired: false,
        });
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setSubscriptionState({
        subscription: null,
        isActive: false,
        isLoading: false,
        hasTrialExpired: false,
      });
    }
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const cancelSubscription = async (subscriptionId: string, cancelAtPeriodEnd: boolean = true) => {
    try {
      const success = await stripeService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

      if (success) {
        // Refresh subscription state
        await loadSubscription();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  };

  const isSubscribed = (): boolean => {
    return subscriptionState.isActive;
  };

  const canAccessPremiumFeatures = (): boolean => {
    // Allow access if:
    // 1. User has active subscription
    // 2. User is in trial period (even if trial has technically expired, give grace period)
    return subscriptionState.isActive || subscriptionState.subscription?.status === 'trialing';
  };

  const value: SubscriptionContextType = {
    ...subscriptionState,
    refreshSubscription,
    cancelSubscription,
    isSubscribed,
    canAccessPremiumFeatures,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);

  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }

  return context;
};

export default SubscriptionContext;
