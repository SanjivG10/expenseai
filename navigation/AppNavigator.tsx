import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Return appropriate navigator based on authentication state
  return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
}