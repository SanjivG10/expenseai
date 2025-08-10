import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Linking, Platform, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as StoreReview from 'expo-store-review';
import { useAuth } from '../contexts/AuthContext';
import ProfileScreen from './ProfileScreen';
import CategoriesScreen from './CategoriesScreen';
import FAQScreen from './FAQScreen';
import { apiService } from '../services/api';
import { SettingsResponse } from '../types/api';

export default function SettingsScreen() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, logout } = useAuth();

  // Fetch settings data from API
  const fetchSettingsData = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiService.getSettingsData();
      
      if (response.success) {
        setSettingsData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleRefresh = () => {
    fetchSettingsData(true);
  };

  const handleProfileSave = async (data: { firstName: string; lastName: string }) => {
    try {
      await apiService.updateProfile(data);
      fetchSettingsData(true); // Refresh settings data
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    // In a real app, you'd save this preference to the backend
    // For now, just update local state
    if (settingsData) {
      setSettingsData({
        ...settingsData,
        preferences: {
          ...settingsData.preferences,
          notifications: enabled
        }
      });
    }
  };

  // Use data from API or fallback to auth context
  const currentUser = settingsData?.userProfile || user || {
    id: '',
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@example.com',
    memberSince: new Date().toISOString(),
  };

  const notificationsEnabled = settingsData?.preferences?.notifications ?? true;

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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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

  // Loading state
  if (isLoading && !settingsData) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar style="light" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="mt-4 text-lg text-muted-foreground">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-4 pt-14">
        <Text className="text-foreground text-2xl font-bold">Settings</Text>
        <Text className="text-muted-foreground mt-1 text-sm">Manage your preferences</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
          />
        }>
        {/* User Profile Card */}
        <View className="border-border bg-secondary mx-6 mt-6 rounded-lg border p-6">
          <View className="flex-row items-center">
            <View className="bg-accent mr-4 h-16 w-16 items-center justify-center rounded-full">
              <Ionicons name="person-outline" size={32} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-xl font-bold">
                {currentUser.firstName} {currentUser.lastName}
              </Text>
              <Text className="text-muted-foreground">{currentUser.email}</Text>
              <Text className="text-muted-foreground mt-1 text-sm">
                Member since {new Date(currentUser.memberSince).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mx-6 mt-6">
            <Text className="text-foreground mb-3 text-lg font-semibold">{section.title}</Text>
            <View className="border-border bg-secondary overflow-hidden rounded-lg border">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={item.onPress}
                  disabled={item.isToggle}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-border border-b' : ''
                  }`}>
                  <View className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
                    (item as any).isDestructive ? 'bg-red-500' : 'bg-accent'
                  }`}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={(item as any).isDestructive ? '#FFFFFF' : '#FFFFFF'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${(item as any).isDestructive ? 'text-red-500' : 'text-foreground'}`}>
                      {item.title}
                    </Text>
                    <Text className="text-muted-foreground mt-1 text-sm">{item.subtitle}</Text>
                  </View>
                  {item.isToggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#404040', true: '#FFFFFF' }}
                      thumbColor={item.value ? '#000000' : '#FFFFFF'}
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
          <View className="border-border bg-secondary rounded-lg border p-4">
            <View className="items-center">
              <Text className="text-foreground font-semibold">ExpenseAI</Text>
              <Text className="text-muted-foreground mt-1 text-sm">Version 1.0.0</Text>
              <Text className="text-muted-foreground mt-2 text-center text-xs">
                Built with ❤️ for better expense tracking
              </Text>
              <Text
                className="text-muted-foreground mt-2 text-center text-xs"
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
        currentUser={currentUser}
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
