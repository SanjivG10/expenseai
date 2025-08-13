import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Text, TouchableOpacity, View, Alert } from 'react-native';
import AddExpenseScreen from './AddExpenseScreen';
import CameraScreen from './CameraScreen';
import VoiceScreen from './VoiceScreen';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionScreen from './SubscriptionScreen';

export default function AddScreen() {
  const [currentView, setCurrentView] = useState<'options' | 'camera' | 'voice' | 'manual' | 'subscription'>('options');
  const [processedData, setProcessedData] = useState<any>(null);
  const { canAccessPremiumFeatures } = useSubscription();

  const handleCameraScanComplete = (data: any) => {
    setProcessedData(data);
    setCurrentView('manual'); // Open manual entry with processed data
  };

  const handleVoiceComplete = (data: any) => {
    setProcessedData(data);
    setCurrentView('manual'); // Open manual entry with voice data
  };

  const handleManualComplete = () => {
    setProcessedData(null);
    setCurrentView('options'); // Back to main options
  };

  const handleBackToOptions = () => {
    setProcessedData(null);
    setCurrentView('options');
  };

  const handlePremiumFeatureClick = (feature: 'camera' | 'voice') => {
    if (!canAccessPremiumFeatures()) {
      // Directly show subscription screen for premium features
      setCurrentView('subscription');
      return;
    }
    
    setCurrentView(feature);
  };

  const handleSubscriptionComplete = () => {
    setCurrentView('options');
  };

  const handleSubscriptionSkip = () => {
    setCurrentView('options');
  };

  // Show camera screen
  if (currentView === 'camera') {
    return (
      <CameraScreen
        onScanComplete={handleCameraScanComplete}
        onBack={handleBackToOptions}
      />
    );
  }

  // Show voice screen
  if (currentView === 'voice') {
    return (
      <VoiceScreen
        onVoiceComplete={handleVoiceComplete}
        onBack={handleBackToOptions}
      />
    );
  }

  // Show manual entry screen
  if (currentView === 'manual') {
    return (
      <AddExpenseScreen
        visible={true}
        onClose={handleBackToOptions}
        onSave={handleManualComplete}
        initialData={processedData}
      />
    );
  }

  // Show subscription screen
  if (currentView === 'subscription') {
    return (
      <SubscriptionScreen
        onComplete={handleSubscriptionComplete}
        onSkip={handleSubscriptionSkip}
        onBack={handleBackToOptions}
        showSkipOption={false}  // Don't show skip when accessing premium features
      />
    );
  }

  // Main options screen
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Add Expense</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Choose how you'd like to add your expense
        </Text>
      </View>

      {/* Options */}
      <View className="flex-1 px-6 pt-8">
        {/* Scan Receipt Option */}
        <TouchableOpacity
          onPress={() => handlePremiumFeatureClick('camera')}
          className="mb-4 flex-row items-center rounded-xl border border-border bg-secondary p-6">
          <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Ionicons name="camera" size={32} color="#000000" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-lg font-semibold text-foreground">Scan Receipt</Text>
              {!canAccessPremiumFeatures() && (
                <View className="ml-2 rounded-md bg-amber-500 px-2 py-1">
                  <Text className="text-xs font-bold text-black">PRO</Text>
                </View>
              )}
            </View>
            <Text className="mt-1 text-sm text-muted-foreground">
              Take a photo of your receipt and let AI extract the details
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#a3a3a3" />
        </TouchableOpacity>

        {/* Voice Entry Option */}
        <TouchableOpacity
          onPress={() => handlePremiumFeatureClick('voice')}
          className="mb-4 flex-row items-center rounded-xl border border-border bg-secondary p-6">
          <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Ionicons name="mic" size={32} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-lg font-semibold text-foreground">Voice Entry</Text>
              {!canAccessPremiumFeatures() && (
                <View className="ml-2 rounded-md bg-amber-500 px-2 py-1">
                  <Text className="text-xs font-bold text-black">PRO</Text>
                </View>
              )}
            </View>
            <Text className="mt-1 text-sm text-muted-foreground">
              Tell us about your expense and we'll create it for you
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#a3a3a3" />
        </TouchableOpacity>

        {/* Manual Entry Option */}
        <TouchableOpacity
          onPress={() => setCurrentView('manual')}
          className="mb-4 flex-row items-center rounded-xl border border-border bg-secondary p-6">
          <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Ionicons name="create" size={32} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">Manual Entry</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Enter expense details manually with full control
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#a3a3a3" />
        </TouchableOpacity>

        {/* Quick Tips */}
        <View className="mt-8 rounded-xl border border-border bg-muted p-4">
          <View className="flex-row items-center">
            <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-foreground">Quick Tips</Text>
          </View>
          <Text className="mt-2 text-sm text-muted-foreground">
            • Scanning works best with clear, well-lit receipts
          </Text>
          <Text className="text-sm text-muted-foreground">
            • Voice entry supports natural language like "Coffee at Starbucks for $5.50"
          </Text>
          <Text className="text-sm text-muted-foreground">
            • Manual entry gives you complete control over all details
          </Text>
        </View>
      </View>
    </View>
  );
}