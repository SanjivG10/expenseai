import React, { useState } from 'react';
import { Text, View } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

type AuthScreen = 'login' | 'signup' | 'forgot-password';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  const navigateToLogin = () => setCurrentScreen('login');
  const navigateToSignup = () => setCurrentScreen('signup');
  const navigateToForgotPassword = () => setCurrentScreen('forgot-password');

  return (
    <View className="flex-1">
      {currentScreen === 'login' && (
        <LoginScreen
          onNavigateToSignup={navigateToSignup}
          onNavigateToForgotPassword={navigateToForgotPassword}
        />
      )}
      {currentScreen === 'signup' && <SignupScreen onNavigateToLogin={navigateToLogin} />}
      {currentScreen === 'forgot-password' && (
        <ForgotPasswordScreen onNavigateToLogin={navigateToLogin} />
      )}
    </View>
  );
}
