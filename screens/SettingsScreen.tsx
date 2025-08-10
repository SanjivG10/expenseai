import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as StoreReview from 'expo-store-review';
import ProfileScreen from './ProfileScreen';
import CategoriesScreen from './CategoriesScreen';
import FAQScreen from './FAQScreen';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);

  // Mock user data - in real app this would come from a user store/context
  const [currentUser, setCurrentUser] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  });

  const handleProfileSave = (data: { firstName: string; lastName: string }) => {
    setCurrentUser((prev) => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
    }));
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
          onToggle: setNotificationsEnabled,
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
  ];

  return (
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-4 pt-14">
        <Text className="text-foreground text-2xl font-bold">Settings</Text>
        <Text className="text-muted-foreground mt-1 text-sm">Manage your preferences</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
              <Text className="text-muted-foreground mt-1 text-sm">Member since Jan 2025</Text>
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
                  <View className="bg-accent mr-4 h-10 w-10 items-center justify-center rounded-full">
                    <Ionicons name={item.icon as any} size={20} color={'#FFFFFF'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-foreground font-medium`}>{item.title}</Text>
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
