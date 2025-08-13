import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';
import { apiService } from './api';
import { detectUserTimezone } from '../types/preferences';
import Toast from 'react-native-toast-message';

// Storage keys
export const NOTIFICATION_PERMISSION_KEY = '@expense_ai_notification_permission';
export const NOTIFICATION_PREFERENCE_KEY = '@expense_ai_notification_preference';
export const PUSH_TOKEN_KEY = '@expense_ai_push_token';

// Configure how notifications should be handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationState {
  hasPermission: boolean;
  isEnabled: boolean;
  pushToken: string | null;
  timezone: string;
}

class UnifiedNotificationService {
  private currentState: NotificationState = {
    hasPermission: false,
    isEnabled: false,
    pushToken: null,
    timezone: detectUserTimezone(),
  };

  /**
   * Initialize notification service - call this on app startup
   */
  async initialize(): Promise<NotificationState> {
    try {
      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      this.currentState.hasPermission = status === 'granted';

      // Load stored preference
      const storedPreference = await AsyncStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
      this.currentState.isEnabled = storedPreference ? JSON.parse(storedPreference) : false;

      // Load stored push token
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      this.currentState.pushToken = storedToken;

      // Detect timezone
      this.currentState.timezone = detectUserTimezone();

      // If user has enabled notifications but we don't have permission, reset their preference
      if (this.currentState.isEnabled && !this.currentState.hasPermission) {
        console.log('User enabled notifications but permission denied - resetting preference');
        await this.setNotificationPreference(false);
      }

      // If we have permission but no push token, try to get one
      if (this.currentState.hasPermission && !this.currentState.pushToken) {
        await this.refreshPushToken();
      }

      console.log('Notification service initialized:', this.currentState);
      return this.getCurrentState();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return this.getCurrentState();
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      this.currentState.hasPermission = granted;

      // Store permission status
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, JSON.stringify(granted));

      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      this.currentState.hasPermission = false;
      return false;
    }
  }

  /**
   * Get and register push token
   */
  async refreshPushToken(): Promise<string | null> {
    try {
      // if (!Constants.isDevice) {
      //   console.log('Push notifications only work on physical devices');
      //   return null;
      // }

      // Ensure we have permissions first
      if (!this.currentState.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('Push notification permissions denied');
          return null;
        }
      }

      // Get the push token
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId,
      });

      const pushToken = pushTokenData.data;
      console.log('Push token obtained:', pushToken);

      // Store token locally
      this.currentState.pushToken = pushToken;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);

      console.log('Push token stored locally:', pushToken);

      // Send token to backend
      await this.sendTokenToBackend(pushToken);

      return pushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  private async sendTokenToBackend(pushToken: string): Promise<void> {
    try {
      const response = await apiService.updatePushToken(pushToken);
      if (response.success) {
        console.log('Push token sent to backend successfully');
      } else {
        console.error('Failed to send push token to backend:', response.message);
      }
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  }

  /**
   * Enable or disable notifications (main toggle function)
   */
  async setNotificationPreference(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        // Request permissions first
        const granted = await this.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive budget reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }

        // Get push token
        const pushToken = await this.refreshPushToken();
        if (!pushToken) {
          Alert.alert('Error', 'Failed to register for push notifications');
          return false;
        }

        // Update backend preferences
        await apiService.updateUserPreferences({
          notifications_enabled: true,
          daily_notifications: true,
          weekly_notifications: true,
          monthly_notifications: true,
          timezone: this.currentState.timezone,
          push_token: pushToken,
        });

        this.currentState.isEnabled = true;
        await AsyncStorage.setItem(NOTIFICATION_PREFERENCE_KEY, JSON.stringify(true));

        console.log('Notifications enabled successfully');
        return true;
      } else {
        // Disable notifications
        await apiService.updateUserPreferences({
          notifications_enabled: false,
          daily_notifications: false,
          weekly_notifications: false,
          monthly_notifications: false,
        });

        this.currentState.isEnabled = false;

        // Remove storage keys
        await AsyncStorage.removeItem(NOTIFICATION_PREFERENCE_KEY);
        // Note: We keep the push token in case user re-enables notifications

        console.log('Notifications disabled successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      return false;
    }
  }

  /**
   * Get current notification state
   */
  getCurrentState(): NotificationState {
    return { ...this.currentState };
  }

  /**
   * Check if notifications are properly set up
   */
  isProperlyConfigured(): boolean {
    return (
      this.currentState.hasPermission &&
      this.currentState.isEnabled &&
      this.currentState.pushToken !== null
    );
  }

  /**
   * Send a test notification (for settings screen)
   */
  async sendTestNotification(type: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      if (!this.isProperlyConfigured()) {
        Alert.alert(
          'Notifications Not Configured',
          'Please enable notifications first to test them.'
        );
        return;
      }

      // Use backend API to send test notification
      let response;
      switch (type) {
        case 'daily':
          response = await apiService.testDailyNotification();
          break;
        case 'weekly':
          response = await apiService.testWeeklyNotification();
          break;
        case 'monthly':
          response = await apiService.testMonthlyNotification();
          break;
      }

      if (response.success) {
        Alert.alert(
          'Test Notification Sent',
          `Check your notifications for the ${type} test message.`
        );
      } else {
        Alert.alert('Test Failed', response.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error(`Error sending ${type} test notification:`, error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  }

  /**
   * Setup notification response handlers
   */
  setupNotificationHandling(): void {
    // Handle notifications received while app is running
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received while app is running:', notification);
    });
  }

  /**
   * Clean up notification data (for logout)
   */
  async cleanup(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        NOTIFICATION_PERMISSION_KEY,
        NOTIFICATION_PREFERENCE_KEY,
        PUSH_TOKEN_KEY,
      ]);

      this.currentState = {
        hasPermission: false,
        isEnabled: false,
        pushToken: null,
        timezone: detectUserTimezone(),
      };

      console.log('Notification service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup notification service:', error);
    }
  }
}

export const unifiedNotificationService = new UnifiedNotificationService();
export default unifiedNotificationService;
