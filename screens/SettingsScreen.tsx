import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [autoBackup, setAutoBackup] = React.useState(true);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Profile Information',
          subtitle: 'Update your personal details',
          onPress: () => console.log('Profile pressed'),
        },
        {
          icon: 'card-outline',
          title: 'Payment Methods',
          subtitle: 'Manage your payment sources',
          onPress: () => console.log('Payment methods pressed'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'globe-outline',
          title: 'Currency',
          subtitle: 'USD ($)',
          onPress: () => console.log('Currency pressed'),
        },
        {
          icon: 'list-outline',
          title: 'Categories',
          subtitle: 'Manage expense categories',
          onPress: () => console.log('Categories pressed'),
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
      title: 'Security',
      items: [
        {
          icon: 'finger-print-outline',
          title: 'Biometric Authentication',
          subtitle: 'Use fingerprint or face ID',
          isToggle: true,
          value: biometricEnabled,
          onToggle: setBiometricEnabled,
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Settings',
          subtitle: 'Control your data privacy',
          onPress: () => console.log('Privacy pressed'),
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: 'cloud-outline',
          title: 'Auto Backup',
          subtitle: 'Automatically backup your data',
          isToggle: true,
          value: autoBackup,
          onToggle: setAutoBackup,
        },
        {
          icon: 'download-outline',
          title: 'Export Data',
          subtitle: 'Download your expense data',
          onPress: () => console.log('Export pressed'),
        },
        {
          icon: 'trash-outline',
          title: 'Clear All Data',
          subtitle: 'Delete all expenses and categories',
          onPress: () => console.log('Clear data pressed'),
          destructive: true,
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
          onPress: () => console.log('Help pressed'),
        },
        {
          icon: 'mail-outline',
          title: 'Contact Support',
          subtitle: 'Send us a message',
          onPress: () => console.log('Contact pressed'),
        },
        {
          icon: 'star-outline',
          title: 'Rate the App',
          subtitle: 'Leave a review on the App Store',
          onPress: () => console.log('Rate pressed'),
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Settings</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Manage your preferences</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View className="mx-6 mt-6 rounded-lg border border-border bg-secondary p-6">
          <View className="flex-row items-center">
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Ionicons name="person-outline" size={32} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">John Doe</Text>
              <Text className="text-muted-foreground">john.doe@example.com</Text>
              <Text className="mt-1 text-sm text-muted-foreground">Member since Jan 2025</Text>
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
                  onPress={item.onPress}
                  disabled={item.isToggle}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.destructive ? '#666666' : '#FFFFFF'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${
                        item.destructive ? 'text-destructive' : 'text-foreground'
                      }`}>
                      {item.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted-foreground">{item.subtitle}</Text>
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
          <View className="rounded-lg border border-border bg-secondary p-4">
            <View className="items-center">
              <Text className="font-semibold text-foreground">ExpenseAI</Text>
              <Text className="mt-1 text-sm text-muted-foreground">Version 1.0.0</Text>
              <Text className="mt-2 text-center text-xs text-muted-foreground">
                Built with ❤️ for better expense tracking
              </Text>
            </View>
          </View>
        </View>
        
        {/* Bottom Spacing for Tab Bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
