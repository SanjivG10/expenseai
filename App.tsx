import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import AppNavigator from './navigation/AppNavigator';
import { unifiedNotificationService } from './services/unifiedNotificationService';

import './global.css';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = __DEV__ 
  ? 'pk_test_...' // Replace with your Stripe test publishable key
  : 'pk_live_...'; // Replace with your Stripe live publishable key

export default function App() {
  useEffect(() => {
    // Initialize notification service when app starts
    const initializeNotifications = async () => {
      try {
        await unifiedNotificationService.initialize();
        unifiedNotificationService.setupNotificationHandling();
        console.log('Notification service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize notification service:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        <SubscriptionProvider>
          <OnboardingProvider>
            <SafeAreaProvider>
              <SafeAreaView className="flex-1">
                <NavigationContainer>
                  <AppNavigator />
                  <StatusBar style="light" backgroundColor="#000000" />
                </NavigationContainer>
                <Toast />
              </SafeAreaView>
            </SafeAreaProvider>
          </OnboardingProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
