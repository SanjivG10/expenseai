import { useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { onboardingCompleted, isCheckingOnboarding, markOnboardingCompleted } = useOnboarding();
  const { canAccessPremiumFeatures, isLoading: subscriptionLoading } = useSubscription();

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

  if (
    showSubscriptionScreen ||
    (isAuthenticated && onboardingCompleted && !canAccessPremiumFeatures())
  ) {
    return (
      <SubscriptionScreen
        onComplete={() => setShowSubscriptionScreen(false)}
        showSkipOption={true}
      />
    );
  }

  return <TabNavigator />;
}
