import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

import './global.css';

export default function App() {
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
