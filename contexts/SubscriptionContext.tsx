import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  SetStateAction,
  Dispatch,
} from 'react';
import { Platform } from 'react-native';
import { apiService } from '../services/api';
import { iapService } from '../services/iapService';
// Removed stripeService - using IAP only
import { UserSubscription, isSubscriptionActive } from '../types/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STORAGE_KEY } from 'constants/storage';

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
  hasSkippedSubscription: boolean;
  setHasSkippedSubscription: Dispatch<SetStateAction<boolean>>;
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

  const [hasSkippedSubscription, setHasSkippedSubscription] = useState(false);

  // Load subscription on mount
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setSubscriptionState((prev) => ({ ...prev, isLoading: true }));

      const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (onboardingStatus?.toString() === 'true') {
        setHasSkippedSubscription(true);
      }

      let subscription: UserSubscription | null = null;

      // Get subscription from IAP only
      try {
        // Check for IAP subscription
        const response = await apiService.get('/iap/subscription-status', true);
        if (response.success && response.data) {
          subscription = response.data;
        }
      } catch (error) {
        console.log('No IAP subscription found');
      }

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
      const response = await apiService.post('/iap/cancel-subscription', {}, true);

      if (response.success) {
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
    hasSkippedSubscription,
    setHasSkippedSubscription,
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
