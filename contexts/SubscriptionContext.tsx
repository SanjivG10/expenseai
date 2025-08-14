import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STORAGE_KEY } from 'constants/storage';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiService } from '../services/api';
import { revenueCatService } from '../services/revenueCatService';
import { UserSubscription, isSubscriptionActive } from '../types/subscription';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    subscription: null,
    isActive: false,
    isLoading: true,
    hasTrialExpired: false,
  });

  const [hasSkippedSubscription, setHasSkippedSubscription] = useState(false);

  // Initialize RevenueCat and login user
  const initializeRevenueCat = async (appUserID: string) => {
    try {
      const success = await revenueCatService.initialize(appUserID);
      if (!success) {
        console.error('Failed to initialize RevenueCat');
        return;
      }

      // Login user to RevenueCat if authenticated
      if (user?.id) {
        await revenueCatService.loginUser(user.id);
      }
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
    }
  };

  // Load subscription on mount and initialize RevenueCat
  useEffect(() => {
    if (!user?.id) return;
    if (user?.id) {
      initializeRevenueCat(user.id);
    }
    loadSubscription();
  }, []);

  // Re-initialize when user changes
  useEffect(() => {
    if (user?.id) {
      initializeRevenueCat(user.id);
    }
  }, [user?.id]);

  const loadSubscription = async () => {
    try {
      setSubscriptionState((prev) => ({ ...prev, isLoading: true }));

      const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (onboardingStatus?.toString() === 'true') {
        setHasSkippedSubscription(true);
      }

      let subscription: UserSubscription | null = null;

      // Get subscription from RevenueCat
      try {
        // First check local RevenueCat customer info
        const hasActiveSubscription = await revenueCatService.hasActiveSubscription();

        if (hasActiveSubscription) {
          // Get subscription details from backend
          const response = await apiService.get('/revenuecat/subscription-status', true);
          if (response.success && response.data) {
            subscription = response.data;
          }
        }
      } catch (error) {
        console.log('No RevenueCat subscription found:', error);
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
      const response = await apiService.post('/revenuecat/cancel-subscription', {}, true);

      if (response.success) {
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
