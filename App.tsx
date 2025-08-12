import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import AppNavigator from './navigation/AppNavigator';
import { unifiedNotificationService } from './services/unifiedNotificationService';

import './global.css';

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
    <AuthProvider>
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
    </AuthProvider>
  );
}
