import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as StoreReview from 'expo-store-review';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LoadingScreen, { InlineLoader } from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { apiService } from '../services/api';
import CategoriesScreen from './CategoriesScreen';
import FAQScreen from './FAQScreen';
import ProfileScreen from './ProfileScreen';
import Toast from 'react-native-toast-message';

// Storage key for notification preference
export const NOTIFICATION_PREFERENCE_KEY = '@expense_ai_notification_preference';

export default function SettingsScreen() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Budget state
  const [dailyBudget, setDailyBudget] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  const { user, logout, setUser } = useAuth();
  const { resetOnboarding } = useOnboarding();

  // Load notification preference and user preferences from storage/API
  useEffect(() => {
    loadNotificationPreference();
    loadUserPreferences();
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
      const enabled = stored ? JSON.parse(stored) : false;
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Failed to load notification preference:', error);
      setNotificationsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await apiService.getUserPreferences();
      if (response.success && response.data) {
        const { daily_budget, weekly_budget, monthly_budget } = response.data;
        setDailyBudget(daily_budget ? daily_budget.toString() : '');
        setWeeklyBudget(weekly_budget ? weekly_budget.toString() : '');
        setMonthlyBudget(monthly_budget ? monthly_budget.toString() : '');
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFERENCE_KEY, JSON.stringify(value));
      setNotificationsEnabled(value);

      // Show feedback to user
      Alert.alert(
        value ? 'Notifications Enabled' : 'Notifications Disabled',
        value
          ? 'You will receive daily spending reminders'
          : 'You will no longer receive spending reminders',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  const handleProfileSave = async (data: { firstName: string; lastName: string }) => {
    try {
      if (!user) return;
      await apiService.updateProfile(data);
      setUser({ ...user, firstName: data.firstName, lastName: data.lastName });
      Toast.show({
        text1: 'Profile updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Profile update error:', error);
      Toast.show({
        text1: 'Failed to update profile',
        type: 'error',
      });
    }
  };

  const handleBudgetSave = async () => {
    try {
      setBudgetLoading(true);

      const updateData = {
        daily_budget: dailyBudget ? parseFloat(dailyBudget) : undefined,
        weekly_budget: weeklyBudget ? parseFloat(weeklyBudget) : undefined,
        monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : undefined,
      };

      const response = await apiService.updateUserPreferences(updateData);

      if (response.success) {
        setShowBudgetModal(false);
        Toast.show({
          text1: 'Budget settings updated successfully',
          type: 'success',
        });
      } else {
        Toast.show({
          text1: response.message || 'Failed to update budget settings',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Budget update error:', error);
      Toast.show({
        text1: 'Failed to update budget settings',
        type: 'error',
      });
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:sanjiv@upgiant.com?subject=ExpenseAI Support');
  };

  const handleRateApp = async () => {
    try {
      const isAvailable = await StoreReview.hasAction();
      if (isAvailable) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.error('Error opening app store:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  // Notification testing handlers
  const testDailyNotification = async () => {
    try {
      const response = await apiService.testDailyNotification();
      if (response.success) {
        Alert.alert(
          '🌙 Daily Reminder (Test)',
          '💰 You have $25.50 remaining in your daily budget of $50.00. Sleep well!'
        );
      } else {
        Alert.alert('Error', 'Failed to trigger daily notification test');
      }
    } catch (error) {
      console.error('Daily notification test error:', error);
      Alert.alert('Error', 'Failed to test daily notification');
    }
  };

  const testWeeklyNotification = async () => {
    try {
      const response = await apiService.testWeeklyNotification();
      if (response.success) {
        Alert.alert(
          '📊 Weekly Summary (Test)',
          "🔶 Weekly spending: $180.75 of $300.00 (60%). You're doing great this week!"
        );
      } else {
        Alert.alert('Error', 'Failed to trigger weekly notification test');
      }
    } catch (error) {
      console.error('Weekly notification test error:', error);
      Alert.alert('Error', 'Failed to test weekly notification');
    }
  };

  const testMonthlyNotification = async () => {
    try {
      const response = await apiService.testMonthlyNotification();
      if (response.success) {
        Alert.alert(
          '📈 Monthly Summary (Test)',
          '💰 Monthly budget remaining: $450.25 of $1,500.00. Keep up the good work!'
        );
      } else {
        Alert.alert('Error', 'Failed to trigger monthly notification test');
      }
    } catch (error) {
      console.error('Monthly notification test error:', error);
      Alert.alert('Error', 'Failed to test monthly notification');
    }
  };

  const resetOnboardingFlow = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding flow and you will see it again on next app restart. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert(
              'Success',
              'Onboarding has been reset. You will see the onboarding screen on next app restart.'
            );
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Profile Information',
          subtitle: 'Update your personal details',
          onPress: () => setShowProfileModal(true),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'list-outline',
          title: 'Categories',
          subtitle: 'Manage expense categories',
          onPress: () => setShowCategoriesModal(true),
        },
        {
          icon: 'wallet-outline',
          title: 'Budget Settings',
          subtitle: 'Set daily, weekly & monthly spending limits',
          onPress: () => setShowBudgetModal(true),
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Daily spending reminders',
          isToggle: true,
          value: notificationsEnabled,
          onToggle: handleNotificationToggle,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & FAQ',
          subtitle: 'Get help using ExpenseAI',
          onPress: () => setShowFAQModal(true),
        },
        {
          icon: 'mail-outline',
          title: 'Contact Support',
          subtitle: 'Send us a message',
          onPress: handleContactSupport,
        },
        {
          icon: 'star-outline',
          title: 'Rate the App',
          subtitle: 'Leave a review on the App Store',
          onPress: handleRateApp,
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          onPress: handleLogout,
          isDestructive: true,
        },
      ],
    },
    {
      title: 'Developer Testing (Remove Later)',
      items: [
        {
          icon: 'moon-outline',
          title: 'Test Daily Notification',
          subtitle: 'Trigger a sample daily reminder',
          onPress: testDailyNotification,
        },
        {
          icon: 'calendar-outline',
          title: 'Test Weekly Notification',
          subtitle: 'Trigger a sample weekly summary',
          onPress: testWeeklyNotification,
        },
        {
          icon: 'trending-up-outline',
          title: 'Test Monthly Notification',
          subtitle: 'Trigger a sample monthly summary',
          onPress: testMonthlyNotification,
        },
        {
          icon: 'refresh-outline',
          title: 'Reset Onboarding',
          subtitle: 'Reset onboarding flow for testing',
          onPress: resetOnboardingFlow,
          isDestructive: true,
        },
      ],
    },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Settings</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Manage your preferences</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#FFFFFF" />
        }>
        {/* User Profile Card */}
        <View className="mx-6 mt-6 rounded-lg border border-border bg-secondary p-6">
          <View className="flex-row items-center">
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Ionicons name="person-outline" size={32} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text className="text-muted-foreground">{user?.email}</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Member since{' '}
                {user?.createdAt &&
                  new Date(user?.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mx-6 mt-6">
            <Text className="mb-3 text-lg font-semibold text-foreground">{section.title}</Text>
            <View className="overflow-hidden rounded-lg border border-border bg-secondary">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={(item as any).isToggle ? undefined : item.onPress}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <View
                    className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
                      (item as any).isDestructive ? 'bg-red-500' : 'bg-accent'
                    }`}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={(item as any).isDestructive ? '#FFFFFF' : '#FFFFFF'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${(item as any).isDestructive ? 'text-red-500' : 'text-foreground'}`}>
                      {item.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted-foreground">{item.subtitle}</Text>
                  </View>
                  {(item as any).isToggle ? (
                    <Switch
                      value={(item as any).value}
                      onValueChange={(item as any).onToggle}
                      trackColor={{ false: '#767577', true: '#22c55e' }}
                      thumbColor={(item as any).value ? '#ffffff' : '#f4f3f4'}
                      ios_backgroundColor="#3e3e3e"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#a3a3a3" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View className="mx-6 mb-8 mt-6">
          <View className="rounded-lg border border-border bg-secondary p-4">
            <View className="items-center">
              <Text className="font-semibold text-foreground">ExpenseAI</Text>
              <Text className="mt-1 text-sm text-muted-foreground">Version 1.0.0</Text>
              <Text className="mt-2 text-center text-xs text-muted-foreground">
                Built with ❤️ for better expense tracking
              </Text>
              <Text
                className="mt-2 text-center text-xs text-muted-foreground"
                onPress={() => Linking.openURL('https://twitter.com/sanjivg10')}>
                By Sanjiv G
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View className="h-10" />
      </ScrollView>

      {/* Modals */}
      <ProfileScreen
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={{
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
        }}
        onSave={handleProfileSave}
      />

      <CategoriesScreen
        visible={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />

      <FAQScreen visible={showFAQModal} onClose={() => setShowFAQModal(false)} />

      {/* Budget Settings Modal */}
      {showBudgetModal && (
        <View className="absolute inset-0 flex-1 justify-end bg-black/50">
          <View className="max-h-96 rounded-t-xl border-t border-border bg-background p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Budget Settings</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Daily Budget */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-medium text-foreground">Daily Budget (USD)</Text>
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <Text className="px-4 py-3 text-lg text-foreground">$</Text>
                  <TextInput
                    value={dailyBudget}
                    onChangeText={setDailyBudget}
                    placeholder="50"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                    className="flex-1 px-2 py-3 text-lg text-foreground"
                  />
                </View>
              </View>

              {/* Weekly Budget */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-medium text-foreground">
                  Weekly Budget (USD)
                </Text>
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <Text className="px-4 py-3 text-lg text-foreground">$</Text>
                  <TextInput
                    value={weeklyBudget}
                    onChangeText={setWeeklyBudget}
                    placeholder="350"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                    className="flex-1 px-2 py-3 text-lg text-foreground"
                  />
                </View>
              </View>

              {/* Monthly Budget */}
              <View className="mb-6">
                <Text className="mb-2 text-sm font-medium text-foreground">
                  Monthly Budget (USD)
                </Text>
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <Text className="px-4 py-3 text-lg text-foreground">$</Text>
                  <TextInput
                    value={monthlyBudget}
                    onChangeText={setMonthlyBudget}
                    placeholder="1500"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                    className="flex-1 px-2 py-3 text-lg text-foreground"
                  />
                </View>
              </View>

              <View className="mb-4 rounded-lg bg-secondary p-4">
                <Text className="text-sm text-muted-foreground">
                  💡 <Text className="font-medium">Tip:</Text> Leave fields empty to disable budget
                  limits. You&apos;ll receive notifications when you reach 80% and 100% of your
                  budget.
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                className="flex-1 rounded-lg border border-border p-4">
                <Text className="text-center font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBudgetSave}
                disabled={budgetLoading}
                className={`flex-1 rounded-lg p-4 ${budgetLoading ? 'bg-muted' : 'bg-primary'}`}>
                {budgetLoading ? (
                  <InlineLoader message="Saving..." showDots={false} />
                ) : (
                  <Text className="text-center font-semibold text-primary-foreground">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
