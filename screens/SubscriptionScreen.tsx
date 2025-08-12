import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { InlineLoader } from '../components/LoadingScreen';
import { apiService } from '../services/api';
import { stripeService } from '../services/stripeService';
import {
  PRICING_PLANS,
  PricingPlan,
  SubscriptionPlan,
  formatPrice,
  getMonthlyEquivalent,
} from '../types/subscription';

interface SubscriptionScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

export default function SubscriptionScreen({
  onComplete,
  onSkip,
  showSkipOption = false,
}: SubscriptionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [cardComplete, setCardComplete] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const { createPaymentMethod, confirmPayment } = useStripe();

  useEffect(() => {
    // Initialize Stripe
    const initializeStripe = async () => {
      try {
        await stripeService.initialize();
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        Alert.alert('Error', 'Payment system initialization failed');
      }
    };

    initializeStripe();
  }, []);

  const handlePlanSelect = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    try {
      if (!cardComplete) {
        Alert.alert('Incomplete Card', 'Please enter complete card details');
        return;
      }

      setProcessingPayment(true);

      if (!createPaymentMethod || !confirmPayment) {
        throw new Error('Stripe not initialized');
      }

      // Create payment method
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (paymentMethodError) {
        console.error('Payment method error:', paymentMethodError);
        Alert.alert('Payment Error', paymentMethodError.message);
        return;
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Create subscription on backend
      const response = await apiService.createSubscription({
        plan: selectedPlan,
        payment_method_id: paymentMethod.id,
      });

      if (!response.success) {
        Alert.alert('Subscription Error', response.message);
        return;
      }

      // Handle 3D Secure or additional authentication if needed
      if (response.data?.client_secret) {
        const { error: confirmError } = await confirmPayment(response.data.client_secret, {
          paymentMethodType: 'Card',
        });

        if (confirmError) {
          console.error('Payment confirmation error:', confirmError);
          Alert.alert('Payment Error', confirmError.message);
          return;
        }
      }

      // Success!
      Toast.show({
        type: 'success',
        text1: 'Subscription Active!',
        text2: 'Welcome to ExpenseAI Premium',
      });

      onComplete();
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderPlanCard = (plan: PricingPlan) => {
    const isSelected = selectedPlan === plan.id;
    const monthlyEquivalent = getMonthlyEquivalent(plan);

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
              <Text className="text-2xl font-bold text-foreground">{formatPrice(plan.price)}</Text>
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
          <Text className="text-2xl font-bold text-foreground">Choose Your Plan</Text>
          {showSkipOption && onSkip && (
            <TouchableOpacity onPress={onSkip}>
              <Text className="text-primary">Skip</Text>
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

        {/* Payment Method */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-foreground">Payment Method</Text>

          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: '#1a1a1a',
              textColor: '#FFFFFF',
              borderColor: '#404040',
              borderWidth: 1,
              borderRadius: 8,
              fontSize: 16,
            }}
            style={{
              height: 50,
              marginVertical: 8,
            }}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
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

        {/* Subscribe Button */}
        <View className="pb-8">
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={!cardComplete || processingPayment}
            className={`rounded-lg p-4 ${
              cardComplete && !processingPayment ? 'bg-primary' : 'bg-muted'
            }`}>
            {processingPayment ? (
              <InlineLoader message="Processing..." showDots={false} />
            ) : (
              <Text
                className={`text-center text-lg font-semibold ${
                  cardComplete ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}>
                {selectedPlanData
                  ? `Subscribe for ${formatPrice(selectedPlanData.price)}/${selectedPlanData.interval}`
                  : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>

          <Text className="mt-3 text-center text-xs text-muted-foreground">
            By subscribing, you agree to our Terms of Service and Privacy Policy. You can cancel
            your subscription at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
