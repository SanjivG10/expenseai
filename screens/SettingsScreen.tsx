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
  TouchableOpacity,
  View,
} from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import CategoriesScreen from './CategoriesScreen';
import FAQScreen from './FAQScreen';
import ProfileScreen from './ProfileScreen';

// Storage key for notification preference
const NOTIFICATION_PREFERENCE_KEY = '@expense_ai_notification_preference';

export default function SettingsScreen() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  // Load notification preference from storage
  useEffect(() => {
    loadNotificationPreference();
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
      await apiService.updateProfile(data);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
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
    </View>
  );
}
