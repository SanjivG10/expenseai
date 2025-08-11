import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { onboardingCompleted, isCheckingOnboarding, markOnboardingCompleted } = useOnboarding();

  // Show loading screen while checking authentication or onboarding state
  if (isLoading || (isAuthenticated && isCheckingOnboarding)) {
    return <LoadingScreen message="Welcome to ExpenseAI" showLogo={true} />;
  }

  // If not authenticated, show auth flow
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // If authenticated but onboarding not completed, show onboarding
  if (isAuthenticated && !onboardingCompleted) {
    return <OnboardingScreen onComplete={markOnboardingCompleted} />;
  }

  // If authenticated and onboarding completed, show main app
  return <TabNavigator />;
}
