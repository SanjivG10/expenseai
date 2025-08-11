import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import LoadingScreen from '../components/LoadingScreen';

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication state
  if (isLoading) {
    return <LoadingScreen message="Welcome to ExpenseAI" showLogo={true} />;
  }

  // Return appropriate navigator based on authentication state
  return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
}
