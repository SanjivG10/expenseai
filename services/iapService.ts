import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  acknowledgePurchaseAndroid,
  finishTransactionIOS,
  PurchaseError,
  SubscriptionPurchase,
  Purchase,
  Product,
} from 'react-native-iap';
import { Platform, Alert } from 'react-native';
import { apiService } from './api';
import { SubscriptionPlan } from '../types/subscription';

// Product IDs - these must match your App Store Connect and Google Play Console configurations
export const IAP_PRODUCT_IDS = {
  WEEKLY: Platform.select({
    ios: 'com.expenseai.weekly',
    android: 'weekly_subscription',
  }) as string,
  MONTHLY: Platform.select({
    ios: 'com.expenseai.monthly', 
    android: 'monthly_subscription',
  }) as string,
  YEARLY: Platform.select({
    ios: 'com.expenseai.yearly',
    android: 'yearly_subscription', 
  }) as string,
} as const;

// Subscription product IDs array
const subscriptionSkus = Object.values(IAP_PRODUCT_IDS);

export interface IAPSubscription extends Product {
  subscriptionPeriodNumberIOS?: string;
  subscriptionPeriodUnitIOS?: string;
  subscriptionGroupIdentifierIOS?: string;
  freeTrialPeriodAndroid?: string;
  subscriptionPeriodAndroid?: string;
}

export interface PurchaseResult {
  success: boolean;
  purchase?: SubscriptionPurchase | Purchase;
  error?: string;
}

class IAPService {
  private isInitialized = false;
  private availableSubscriptions: IAPSubscription[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  /**
   * Initialize IAP connection and listeners
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      console.log('🚀 Initializing IAP Service...');

      // Initialize connection
      const result = await initConnection();
      console.log('IAP Connection result:', result);

      // Set up listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        (purchase: SubscriptionPurchase | Purchase) => {
          console.log('✅ Purchase successful:', purchase);
          this.handlePurchaseUpdate(purchase);
        }
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          console.error('❌ Purchase error:', error);
          this.handlePurchaseError(error);
        }
      );

      // Load available subscriptions
      await this.loadSubscriptions();

      this.isInitialized = true;
      console.log('✅ IAP Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ IAP initialization failed:', error);
      return false;
    }
  }

  /**
   * Load available subscriptions from stores
   */
  async loadSubscriptions(): Promise<IAPSubscription[]> {
    try {
      console.log('📦 Loading subscriptions...', subscriptionSkus);
      
      const products = await getSubscriptions({ skus: subscriptionSkus });
      console.log('📦 Available subscriptions:', products);
      
      this.availableSubscriptions = products;
      return products;
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      return [];
    }
  }

  /**
   * Get available subscriptions
   */
  getAvailableSubscriptions(): IAPSubscription[] {
    return this.availableSubscriptions;
  }

  /**
   * Get subscription by product ID
   */
  getSubscriptionByPlan(plan: SubscriptionPlan): IAPSubscription | null {
    const productId = this.getProductIdByPlan(plan);
    return this.availableSubscriptions.find(sub => sub.productId === productId) || null;
  }

  /**
   * Get product ID by plan
   */
  getProductIdByPlan(plan: SubscriptionPlan): string {
    switch (plan) {
      case 'weekly':
        return IAP_PRODUCT_IDS.WEEKLY;
      case 'monthly':
        return IAP_PRODUCT_IDS.MONTHLY;
      case 'yearly':
        return IAP_PRODUCT_IDS.YEARLY;
      default:
        return IAP_PRODUCT_IDS.MONTHLY;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(plan: SubscriptionPlan): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('IAP Service not initialized');
      }

      const productId = this.getProductIdByPlan(plan);
      console.log(`🛒 Purchasing subscription: ${plan} (${productId})`);

      const purchase = await requestSubscription({ 
        sku: productId,
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [{
            sku: productId,
            offerToken: '', // This would be provided by Google Play
          }]
        })
      });

      console.log('✅ Purchase initiated:', purchase);
      
      return {
        success: true,
        purchase,
      };
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Handle successful purchase
   */
  private async handlePurchaseUpdate(purchase: SubscriptionPurchase | Purchase) {
    try {
      console.log('🔄 Processing purchase:', purchase);

      // Verify purchase with backend
      const verificationResult = await this.verifyPurchase(purchase);
      
      if (verificationResult.success) {
        // Finish the transaction
        await this.finishPurchase(purchase);
        
        Alert.alert(
          'Subscription Active!',
          'Your premium subscription is now active. Enjoy all features!',
          [{ text: 'Great!' }]
        );
      } else {
        console.error('Purchase verification failed:', verificationResult.error);
        Alert.alert(
          'Purchase Error',
          'There was an issue verifying your purchase. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error handling purchase update:', error);
    }
  }

  /**
   * Handle purchase error
   */
  private handlePurchaseError(error: PurchaseError) {
    console.error('Purchase error details:', error);
    
    // Don't show error for user cancellation
    if (error.code === 'E_USER_CANCELLED') {
      console.log('User cancelled purchase');
      return;
    }

    Alert.alert(
      'Purchase Failed',
      error.message || 'An error occurred during purchase. Please try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Verify purchase with backend
   */
  private async verifyPurchase(purchase: SubscriptionPurchase | Purchase): Promise<{ success: boolean; error?: string }> {
    try {
      // Send receipt to backend for verification
      const response = await apiService.verifyPurchase({
        receipt: purchase,
        platform: Platform.OS,
      });

      return {
        success: response.success,
        error: response.success ? undefined : response.message,
      };
    } catch (error: any) {
      console.error('Purchase verification error:', error);
      return {
        success: false,
        error: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Finish purchase transaction
   */
  private async finishPurchase(purchase: SubscriptionPurchase | Purchase) {
    try {
      if (Platform.OS === 'ios') {
        await finishTransactionIOS(purchase.transactionId);
      } else if (Platform.OS === 'android') {
        // For Android, acknowledge the purchase
        if ((purchase as SubscriptionPurchase).purchaseToken) {
          await acknowledgePurchaseAndroid((purchase as SubscriptionPurchase).purchaseToken);
        }
      }

      await finishTransaction({ purchase, isConsumable: false });
      console.log('✅ Transaction finished successfully');
    } catch (error) {
      console.error('Error finishing transaction:', error);
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<(SubscriptionPurchase | Purchase)[]> {
    try {
      console.log('🔄 Restoring purchases...');
      
      const purchases = await getAvailablePurchases();
      console.log('📦 Restored purchases:', purchases);

      // Process each restored purchase
      for (const purchase of purchases) {
        await this.verifyPurchase(purchase);
      }

      return purchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const purchases = await getAvailablePurchases();
      
      // Check if any purchase is a valid subscription
      return purchases.some(purchase => {
        // Check if purchase is still valid (not expired)
        if (Platform.OS === 'android') {
          const androidPurchase = purchase as SubscriptionPurchase;
          return androidPurchase.autoRenewingAndroid === true;
        } else {
          // For iOS, check expiration date
          const iosPurchase = purchase as any;
          return iosPurchase.originalTransactionDateIOS && 
                 new Date(iosPurchase.expirationDate || 0) > new Date();
        }
      });
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Get current subscription info
   */
  async getCurrentSubscription(): Promise<SubscriptionPurchase | Purchase | null> {
    try {
      const purchases = await getAvailablePurchases();
      
      // Find the most recent active subscription
      const activePurchases = purchases.filter(purchase => {
        if (Platform.OS === 'android') {
          const androidPurchase = purchase as SubscriptionPurchase;
          return androidPurchase.autoRenewingAndroid === true;
        } else {
          const iosPurchase = purchase as any;
          return iosPurchase.originalTransactionDateIOS && 
                 new Date(iosPurchase.expirationDate || 0) > new Date();
        }
      });

      return activePurchases.length > 0 ? activePurchases[0] : null;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return null;
    }
  }

  /**
   * Format price for display
   */
  formatPrice(subscription: IAPSubscription): string {
    if (Platform.OS === 'ios') {
      return subscription.localizedPrice || subscription.price;
    } else {
      // Android price is in micros (1,000,000 = 1 unit)
      const price = parseFloat(subscription.price) / 1000000;
      return `$${price.toFixed(2)}`;
    }
  }

  /**
   * Clean up IAP service
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up IAP Service...');
      
      // Remove listeners
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      // End connection
      await endConnection();
      
      this.isInitialized = false;
      console.log('✅ IAP Service cleanup completed');
    } catch (error) {
      console.error('Error during IAP cleanup:', error);
    }
  }
}

export const iapService = new IAPService();
export default iapService;