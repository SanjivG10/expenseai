import { useSubscription } from 'contexts/SubscriptionContext';
import { useState } from 'react';
import SubscriptionScreen from 'screens/SubscriptionScreen';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { ONBOARDING_STORAGE_KEY } from 'constants/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { onboardingCompleted, isCheckingOnboarding, markOnboardingCompleted } = useOnboarding();
  const {
    canAccessPremiumFeatures,
    isLoading: subscriptionLoading,
    hasSkippedSubscription,
    setHasSkippedSubscription,
  } = useSubscription();

  const [showSubscriptionScreen, setShowSubscriptionScreen] = useState(false);

  // Show loading screen while checking authentication, onboarding or subscription state
  if (isLoading || (isAuthenticated && isCheckingOnboarding) || subscriptionLoading) {
    return <LoadingScreen message="Welcome to ExpenseAI" showLogo={true} />;
  }

  // If not authenticated, show auth flow
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (isAuthenticated && !onboardingCompleted) {
    return (
      <OnboardingScreen
        onComplete={() => {
          markOnboardingCompleted();
          setShowSubscriptionScreen(true);
        }}
      />
    );
  }

  // Show subscription screen only if explicitly requested or after onboarding (and user hasn't skipped)
  if (
    showSubscriptionScreen ||
    (isAuthenticated &&
      onboardingCompleted &&
      !canAccessPremiumFeatures() &&
      !hasSkippedSubscription)
  ) {
    return (
      <SubscriptionScreen
        onComplete={() => setShowSubscriptionScreen(false)}
        onSkip={() => {
          AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          setShowSubscriptionScreen(false);
          setHasSkippedSubscription(true);
        }}
        showSkipOption={true}
      />
    );
  }

  return <TabNavigator />;
}
