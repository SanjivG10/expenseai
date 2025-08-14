import { ENV } from 'constants/envs';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import { SubscriptionPlan } from '../types/subscription';

// RevenueCat Product IDs - these must match your RevenueCat dashboard
export const REVENUECAT_PRODUCT_IDS = {
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

// RevenueCat Entitlement ID (set in RevenueCat dashboard)
export const ENTITLEMENT_ID = 'premium';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export interface RestorePurchasesResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export class RevenueCatService {
  private isInitialized = false;

  /**
   * Initialize RevenueCat with API keys
   * You'll need to set these in your constants/envs.ts
   */
  async initialize(appUserID: string): Promise<boolean> {
    try {
      const apiKey = Platform.select({
        ios: ENV.REVENUECAT_IOS_API_KEY,
        android: ENV.REVENUECAT_ANDROID_API_KEY,
      });

      if (!apiKey) {
        console.error('RevenueCat API key not found');
        return false;
      }

      Purchases.configure({
        apiKey,
        appUserID,
        userDefaultsSuiteName: undefined,
        useAmazon: false,
        shouldShowInAppMessagesAutomatically: false,
      });

      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log('Customer info updated:', customerInfo);
        // You can emit events here if needed
      });

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      return false;
    }
  }

  /**
   * Set user ID for RevenueCat (call when user logs in)
   */
  async loginUser(userId: string): Promise<void> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('User logged in to RevenueCat:', customerInfo);
    } catch (error) {
      console.error('Failed to login user to RevenueCat:', error);
    }
  }

  async logoutUserFromRevenueCat(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      console.error('Failed to logout user from RevenueCat:', error);
    }
  }

  /**
   * Get available subscription offerings from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        console.log('No current offering available');
        return null;
      }
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Get specific package by subscription plan
   */
  async getPackageByPlan(plan: SubscriptionPlan): Promise<PurchasesPackage | null> {
    try {
      const offering = await this.getOfferings();
      if (!offering) return null;

      const productId =
        REVENUECAT_PRODUCT_IDS[plan.toUpperCase() as keyof typeof REVENUECAT_PRODUCT_IDS];

      const packageObj = offering.availablePackages.find((pkg) => pkg.identifier === productId);

      return packageObj || null;
    } catch (error) {
      console.error('Failed to get package by plan:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(plan: SubscriptionPlan): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        return { success: false, error: 'RevenueCat not initialized' };
      }

      const packageObj = await this.getPackageByPlan(plan);
      if (!packageObj) {
        return { success: false, error: 'Subscription package not found' };
      }

      const { customerInfo } = await Purchases.purchasePackage(packageObj);

      // Check if the purchase was successful
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        return { success: true, customerInfo };
      } else {
        return { success: false, error: 'Purchase completed but entitlement not found' };
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const v: PurchasesError = error as PurchasesError;

      if (v.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { success: false, error: 'Purchase cancelled by user' };
      }
      return { success: false, error: v.message };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<RestorePurchasesResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        return { success: true, customerInfo };
      } else {
        return { success: false, error: 'No active subscriptions found' };
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { success: false, error: 'Failed to restore purchases' };
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Format price for display (from store product)
   */
  formatPrice(storeProduct: PurchasesStoreProduct): string {
    return storeProduct.priceString;
  }

  /**
   * Get subscription by plan ID (for compatibility with existing code)
   */
  async getSubscriptionByPlan(plan: SubscriptionPlan): Promise<PurchasesStoreProduct | null> {
    try {
      const packageObj = await this.getPackageByPlan(plan);
      return packageObj?.product || null;
    } catch (error) {
      console.error('Failed to get subscription by plan:', error);
      return null;
    }
  }

  /**
   * Load all available subscriptions
   */
  async loadSubscriptions(): Promise<PurchasesStoreProduct[]> {
    try {
      const offering = await this.getOfferings();
      if (!offering) return [];

      return offering.availablePackages.map((pkg) => pkg.product);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      return [];
    }
  }

  /**
   * Cleanup RevenueCat (call on app unmount)
   */
  cleanup(): void {
    // RevenueCat doesn't require explicit cleanup
    this.isInitialized = false;
    console.log('RevenueCat service cleaned up');
  }
}

export const revenueCatService = new RevenueCatService();
