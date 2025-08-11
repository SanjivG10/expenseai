import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LoadingScreen, { InlineLoader } from '../components/LoadingScreen';
import { apiService } from '../services/api';
import { OnboardingRequest } from '../types';
import Logo from 'components/Logo';
import { NOTIFICATION_PREFERENCE_KEY } from './SettingsScreen';

// Storage key for notification preference (same as SettingsScreen)

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [dailyBudget, setDailyBudget] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const steps = [
    {
      title: 'Welcome to ExpenseAI!',
      subtitle: "Let's set up your expense tracking preferences to get started.",
      component: 'welcome',
    },
    {
      title: 'Daily Budget',
      subtitle: 'Set your daily spending limit (optional)',
      component: 'daily',
    },
    {
      title: 'Weekly Budget',
      subtitle: 'Set your weekly spending limit (optional)',
      component: 'weekly',
    },
    {
      title: 'Monthly Budget',
      subtitle: 'Set your monthly spending limit (optional)',
      component: 'monthly',
    },
    {
      title: 'Notifications',
      subtitle: 'Get spending reminders and budget updates',
      component: 'notifications',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      const onboardingData: OnboardingRequest = {
        daily_budget: dailyBudget ? Number(parseFloat(dailyBudget).toFixed(2)) : 0,
        weekly_budget: weeklyBudget ? Number(parseFloat(weeklyBudget).toFixed(2)) : 0,
        monthly_budget: monthlyBudget ? Number(parseFloat(monthlyBudget).toFixed(2)) : 0,
        notifications_enabled: notificationsEnabled,
        currency: 'USD',
      };

      const response = await apiService.completeOnboarding(onboardingData);

      if (response.success) {
        try {
          await AsyncStorage.setItem(
            NOTIFICATION_PREFERENCE_KEY,
            JSON.stringify(notificationsEnabled)
          );
        } catch (storageError) {
          console.error('Failed to save notification preference to storage:', storageError);
        }

        Alert.alert(
          'Welcome! 🎉',
          'Your preferences have been saved. You can change them anytime in Settings.',
          [
            {
              text: 'Get Started',
              onPress: onComplete,
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateBudgetInput = (value: string): boolean => {
    if (!value) return true; // Optional field
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num <= 100000;
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: // Daily budget
        return dailyBudget === '' || validateBudgetInput(dailyBudget);
      case 2: // Weekly budget
        return weeklyBudget === '' || validateBudgetInput(weeklyBudget);
      case 3: // Monthly budget
        return monthlyBudget === '' || validateBudgetInput(monthlyBudget);
      default:
        return true;
    }
  };

  const renderWelcomeStep = () => (
    <View className="items-center px-6 py-12">
      <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-primary">
        <Logo />
      </View>
      <Text className="mb-6 text-center text-lg text-muted-foreground">
        ExpenseAI helps you track your spending with AI-powered receipt scanning and smart budget
        management.
      </Text>
      <View className="mb-8 w-full">
        <View className="mb-4 flex-row items-center">
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" className="mr-3" />
          <Text className="text-foreground">Scan receipts/items with AI</Text>
        </View>
        <View className="mb-4 flex-row items-center">
          <Ionicons name="analytics-outline" size={20} color="#FFFFFF" className="mr-3" />
          <Text className="text-foreground">Track spending patterns</Text>
        </View>
        <View className="mb-4 flex-row items-center">
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" className="mr-3" />
          <Text className="text-foreground">Get budget reminders</Text>
        </View>
      </View>
    </View>
  );

  const renderBudgetStep = (
    type: 'daily' | 'weekly' | 'monthly',
    value: string,
    setValue: (value: string) => void
  ) => (
    <View className="px-6 py-8">
      <View className="mb-8 items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Ionicons
            name={
              type === 'daily'
                ? 'calendar-outline'
                : type === 'weekly'
                  ? 'calendar-outline'
                  : 'trending-up-outline'
            }
            size={32}
            color="#FFFFFF"
          />
        </View>
        <Text className="text-center text-muted-foreground">
          {type === 'daily'
            ? "Set a daily spending limit to help control your budget. We'll send you reminders each evening."
            : type === 'weekly'
              ? "Set a weekly spending limit. We'll send you updates every Sunday morning."
              : "Set a monthly spending limit. We'll send you updates at the end of each month."}
        </Text>
      </View>

      <View className="mb-6">
        <Text className="mb-2 text-sm font-medium text-foreground">
          {type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Monthly'} Budget (USD)
        </Text>
        <View className="flex-row items-center rounded-lg border border-border bg-input">
          <Text className="px-4 py-3 text-lg text-foreground">$</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={type === 'daily' ? '50' : type === 'weekly' ? '350' : '1500'}
            placeholderTextColor="#a3a3a3"
            keyboardType="numeric"
            className="flex-1 px-2 py-3 text-lg text-foreground"
          />
        </View>
        {value && !validateBudgetInput(value) && (
          <Text className="mt-2 text-sm text-red-500">
            Please enter a valid amount (max $100,000)
          </Text>
        )}
      </View>
    </View>
  );

  const renderNotificationsStep = () => (
    <View className="px-6 py-8">
      <View className="mb-8 items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Ionicons name="notifications-outline" size={32} color="#FFFFFF" />
        </View>
        <Text className="text-center text-muted-foreground">
          Get helpful reminders about your spending and budget progress.
        </Text>
      </View>

      <View className="mb-6 rounded-lg border border-border bg-secondary p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-medium text-foreground">Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#404040', true: '#FFFFFF' }}
            thumbColor={notificationsEnabled ? '#000000' : '#f4f3f4'}
          />
        </View>
        <Text className="text-sm text-muted-foreground">
          We&apos;ll send you local notifications about your spending progress and budget reminders.
        </Text>
      </View>

      {notificationsEnabled && (
        <View className="space-y-4">
          <View className="flex-row items-center rounded-lg bg-input p-4">
            <Ionicons name="moon-outline" size={20} color="#FFFFFF" className="mr-3" />
            <View className="flex-1">
              <Text className="font-medium text-foreground">Daily Updates</Text>
              <Text className="text-sm text-muted-foreground">Every evening at 9 PM</Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-lg bg-input p-4">
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" className="mr-3" />
            <View className="flex-1">
              <Text className="font-medium text-foreground">Weekly Updates</Text>
              <Text className="text-sm text-muted-foreground">Sunday mornings at 10 AM</Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-lg bg-input p-4">
            <Ionicons name="trending-up-outline" size={20} color="#FFFFFF" className="mr-3" />
            <View className="flex-1">
              <Text className="font-medium text-foreground">Monthly Updates</Text>
              <Text className="text-sm text-muted-foreground">Last day of month at 10 AM</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.component) {
      case 'welcome':
        return renderWelcomeStep();
      case 'daily':
        return renderBudgetStep('daily', dailyBudget, setDailyBudget);
      case 'weekly':
        return renderBudgetStep('weekly', weeklyBudget, setWeeklyBudget);
      case 'monthly':
        return renderBudgetStep('monthly', monthlyBudget, setMonthlyBudget);
      case 'notifications':
        return renderNotificationsStep();
      default:
        return null;
    }
  };

  if (isSubmitting) {
    return <LoadingScreen message="Setting up your account..." />;
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </Text>
          {currentStep > 0 && (
            <TouchableOpacity onPress={handleBack} className="rounded-lg p-2">
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        <View className="mb-4 h-2 rounded-full bg-border">
          <View
            className="h-2 rounded-full bg-primary"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </View>

        <Text className="text-2xl font-bold text-foreground">{steps[currentStep].title}</Text>
        <Text className="mt-1 text-muted-foreground">{steps[currentStep].subtitle}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-border p-6">
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed()}
          className={`rounded-lg p-4 ${canProceed() ? 'bg-primary' : 'bg-muted'}`}>
          {isSubmitting ? (
            <InlineLoader message="Completing setup..." showDots={false} />
          ) : (
            <Text
              className={`text-center text-lg font-semibold ${
                canProceed() ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}>
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} className="mt-3 rounded-lg p-4">
            <Text className="text-center text-foreground">Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
