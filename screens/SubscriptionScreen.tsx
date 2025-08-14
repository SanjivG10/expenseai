import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { InlineLoader } from '../components/LoadingScreen';
import { revenueCatService } from '../services/revenueCatService';
import type { PurchasesStoreProduct } from 'react-native-purchases';
import {
  PRICING_PLANS,
  PricingPlan,
  SubscriptionPlan,
  formatPrice,
  getMonthlyEquivalent,
} from '../types/subscription';
import { useAuth } from 'contexts/AuthContext';

interface SubscriptionScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkipOption?: boolean;
}

export default function SubscriptionScreen({
  onComplete,
  onSkip,
  onBack,
  showSkipOption = false,
}: SubscriptionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [availableSubscriptions, setAvailableSubscriptions] = useState<PurchasesStoreProduct[]>([]);
  const [revenueCatInitialized, setRevenueCatInitialized] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const initializeRevenueCat = async () => {
      try {
        const success = await revenueCatService.initialize(user.id);
        if (success) {
          const subscriptions = await revenueCatService.loadSubscriptions();
          setAvailableSubscriptions(subscriptions);
          setRevenueCatInitialized(true);
          console.log('✅ RevenueCat initialized with subscriptions:', subscriptions);
        } else {
          Alert.alert('Error', 'Payment system initialization failed');
        }
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        Alert.alert('Error', 'Payment system initialization failed');
      }
    };

    initializeRevenueCat();

    // Cleanup on unmount
    return () => {
      revenueCatService.cleanup();
    };
  }, [user?.id]);

  const handlePlanSelect = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    try {
      if (!revenueCatInitialized) {
        Alert.alert('Error', 'Payment system not ready. Please try again.');
        return;
      }

      setProcessingPayment(true);
      console.log('🛒 Starting RevenueCat purchase for plan:', selectedPlan);

      // Purchase subscription via RevenueCat
      const result = await revenueCatService.purchaseSubscription(selectedPlan);

      if (result.success) {
        console.log('✅ RevenueCat purchase successful');

        Toast.show({
          type: 'success',
          text1: 'Subscription Activated!',
          text2: 'Welcome to ExpenseAI Premium',
        });

        onComplete();
      } else {
        console.error('❌ RevenueCat purchase failed:', result.error);
        Alert.alert(
          'Purchase Failed',
          result.error || 'Failed to process purchase. Please try again.'
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setProcessingPayment(true);
      console.log('🔄 Restoring purchases...');

      const result = await revenueCatService.restorePurchases();

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Purchases Restored!',
          text2: 'Your subscription has been restored.',
        });
        onComplete();
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderPlanCard = (plan: PricingPlan) => {
    const isSelected = selectedPlan === plan.id;
    const monthlyEquivalent = getMonthlyEquivalent(plan);

    // Try to get RevenueCat subscription for this plan
    const revenueCatSubscription = availableSubscriptions.find(
      (sub) =>
        sub.identifier ===
        (plan.id === 'weekly'
          ? 'weekly_subscription'
          : plan.id === 'monthly'
            ? 'monthly_subscription'
            : 'yearly_subscription')
    );
    const displayPrice = revenueCatSubscription
      ? revenueCatSubscription.priceString
      : formatPrice(plan.price);

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handlePlanSelect(plan.id)}
        className={`mb-4 rounded-xl border-2 p-4 ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border bg-secondary'
        } ${plan.isPopular ? 'relative' : ''}`}>
        {plan.isPopular && (
          <View className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1">
            <Text className="text-xs font-bold text-primary-foreground">MOST POPULAR</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{plan.name}</Text>
            <Text className="text-sm text-muted-foreground">{plan.description}</Text>

            <View className="mt-2 flex-row items-baseline">
              <Text className="text-2xl font-bold text-foreground">{displayPrice}</Text>
              <Text className="ml-1 text-sm text-muted-foreground">/{plan.interval}</Text>
            </View>

            {plan.originalPrice && (
              <View className="flex-row items-center">
                <Text className="text-sm text-muted-foreground line-through">
                  {formatPrice(plan.originalPrice)}
                </Text>
                {plan.savings && (
                  <Text className="ml-2 text-xs font-semibold text-green-500">{plan.savings}</Text>
                )}
              </View>
            )}

            {plan.interval !== 'month' && (
              <Text className="text-xs text-muted-foreground">
                {formatPrice(monthlyEquivalent)}/month equivalent
              </Text>
            )}
          </View>

          <View className="ml-4">
            <View
              className={`h-6 w-6 rounded-full border-2 ${
                isSelected ? 'border-primary bg-primary' : 'border-muted'
              } items-center justify-center`}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </View>
        </View>

        <View className="mt-3 space-y-1">
          {plan.features.map((feature, index) => (
            <View key={index} className="flex-row items-center">
              <Ionicons name="checkmark" size={16} color="#22c55e" />
              <Text className="ml-2 text-sm text-muted-foreground">{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const selectedPlanData = PRICING_PLANS.find((p) => p.id === selectedPlan);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {onBack && (
              <TouchableOpacity onPress={onBack} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text className="text-2xl font-bold text-foreground">Choose Your Plan</Text>
          </View>
          {showSkipOption && onSkip && (
            <TouchableOpacity onPress={onSkip} className="px-3 py-1">
              <Text className="font-medium text-primary">Skip</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text className="mt-1 text-muted-foreground">
          Unlock premium features and get the most out of ExpenseAI
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Pricing Plans */}
        <View className="py-6">{PRICING_PLANS.map(renderPlanCard)}</View>

        {/* Payment Information */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">Payment Method</Text>

          <View className="rounded-lg border border-border bg-secondary p-4">
            <View className="flex-row items-center">
              <Ionicons name="phone-portrait-outline" size={20} color="#22c55e" />
              <Text className="ml-2 text-sm font-medium text-foreground">Mobile Payment</Text>
            </View>
            <Text className="mt-2 text-xs text-muted-foreground">
              Payment will be processed through your device&apos;s app store. You can manage your
              subscription in your App Store or Google Play settings.
            </Text>
          </View>
        </View>

        {/* Security Info */}
        <View className="mb-6 rounded-lg bg-secondary p-4">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
            <Text className="ml-2 text-sm font-medium text-foreground">Secure Payment</Text>
          </View>
          <Text className="mt-1 text-xs text-muted-foreground">
            Your payment information is encrypted and secure. You can cancel anytime.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="pb-8">
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={processingPayment || !revenueCatInitialized}
            className={`mb-3 rounded-lg p-4 ${
              !processingPayment && revenueCatInitialized ? 'bg-primary' : 'bg-muted'
            }`}>
            {processingPayment ? (
              <InlineLoader message="Processing..." showDots={false} />
            ) : (
              <Text
                className={`text-center text-lg font-semibold ${
                  !processingPayment && revenueCatInitialized
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                }`}>
                {selectedPlanData ? `Subscribe - ${selectedPlanData.name}` : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases Button */}
          <TouchableOpacity
            onPress={handleRestorePurchases}
            disabled={processingPayment || !revenueCatInitialized}
            className="mb-3 rounded-lg border border-border p-3">
            <Text className="text-center font-medium text-foreground">Restore Purchases</Text>
          </TouchableOpacity>

          <Text className="mt-3 text-center text-xs text-muted-foreground">
            By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions
            auto-renew unless cancelled. Manage in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
