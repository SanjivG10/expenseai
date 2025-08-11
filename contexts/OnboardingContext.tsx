import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { UserPreferences } from '../types';
import { useAuth } from './AuthContext';

interface OnboardingContextType {
  onboardingCompleted: boolean;
  isCheckingOnboarding: boolean;
  markOnboardingCompleted: () => void;
  checkOnboardingStatus: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = '@expense_ai_onboarding_completed';

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const { isAuthenticated, user } = useAuth();

  // Check onboarding status when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      checkOnboardingStatus();
    } else if (!isAuthenticated) {
      // Reset onboarding state when user logs out
      setOnboardingCompleted(false);
      setIsCheckingOnboarding(false);
      // Clear from storage
      AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, [isAuthenticated, user]);

  const checkOnboardingStatus = async () => {
    try {
      setIsCheckingOnboarding(true);
      
      // First check local storage for quick access
      const localStatus = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (localStatus === 'true') {
        setOnboardingCompleted(true);
        setIsCheckingOnboarding(false);
        return;
      }

      // Check from API if not found locally or if local is false
      const response = await apiService.getUserPreferences();
      
      if (response.success && response.data) {
        const completed = response.data.onboarding_completed;
        setOnboardingCompleted(completed);
        
        // Save to local storage for future quick access
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, completed.toString());
      } else {
        // If API fails, assume onboarding is not completed
        setOnboardingCompleted(false);
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // On error, assume onboarding is not completed
      setOnboardingCompleted(false);
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const markOnboardingCompleted = async () => {
    try {
      setOnboardingCompleted(true);
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      setOnboardingCompleted(false);
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingCompleted,
        isCheckingOnboarding,
        markOnboardingCompleted,
        checkOnboardingStatus,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}