import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import env from '../config/env';

interface IOSReceiptData {
  transactionId: string;
  productId: string;
  originalTransactionIdentifierIOS?: string;
  transactionReceiptIOS?: string;
}

interface AndroidReceiptData {
  transactionId: string;
  productId: string;
  purchaseTokenAndroid?: string | undefined;
  dataAndroid?: string | undefined;
  signatureAndroid?: string | undefined;
}

interface VerificationResult {
  isValid: boolean;
  productId: string;
  transactionId: string;
  expirationDate?: Date | null;
  originalTransactionId?: string | undefined;
  platform: 'ios' | 'android';
  receiptData?: any;
}

export class IAPService {
  /**
   * Verify receipt with Apple App Store or Google Play Store
   */
  async verifyReceipt(
    receipt: IOSReceiptData | AndroidReceiptData,
    platform: 'ios' | 'android'
  ): Promise<VerificationResult> {
    try {
      if (platform === 'ios') {
        return await this.verifyIOSReceipt(receipt as IOSReceiptData);
      } else {
        return await this.verifyAndroidReceipt(receipt as AndroidReceiptData);
      }
    } catch (error) {
      console.error('Receipt verification failed:', error);
      return {
        isValid: false,
        productId: receipt.productId,
        transactionId: receipt.transactionId,
        platform,
      };
    }
  }

  /**
   * Verify iOS receipt with Apple App Store
   */
  private async verifyIOSReceipt(receipt: IOSReceiptData): Promise<VerificationResult> {
    try {
      const receiptData = receipt.transactionReceiptIOS;

      if (!receiptData) {
        throw new Error('Missing iOS receipt data');
      }

      // Try production endpoint first
      let response = await this.verifyWithApple(receiptData, false);

      // If production fails with sandbox receipt error, try sandbox
      if (response.status === 21007) {
        response = await this.verifyWithApple(receiptData, true);
      }

      if (response.status !== 0) {
        console.error('Apple verification failed:', response);
        return {
          isValid: false,
          productId: receipt.productId,
          transactionId: receipt.transactionId,
          platform: 'ios',
        };
      }

      // Extract subscription info from response
      const latestReceiptInfo = response.latest_receipt_info?.[0];
      const expirationDate = latestReceiptInfo?.expires_date_ms
        ? new Date(parseInt(latestReceiptInfo.expires_date_ms))
        : null;

      return {
        isValid: true,
        productId: receipt.productId,
        transactionId: receipt.transactionId,
        originalTransactionId: receipt.originalTransactionIdentifierIOS,
        expirationDate,
        platform: 'ios',
        receiptData: response,
      };
    } catch (error) {
      console.error('iOS receipt verification error:', error);
      return {
        isValid: false,
        productId: receipt.productId,
        transactionId: receipt.transactionId,
        platform: 'ios',
      };
    }
  }

  /**
   * Call Apple's verification API
   */
  private async verifyWithApple(receiptData: string, isSandbox: boolean): Promise<any> {
    const url = isSandbox
      ? 'https://sandbox.itunes.apple.com/verifyReceipt'
      : 'https://buy.itunes.apple.com/verifyReceipt';

    const response = await axios.post(url, {
      'receipt-data': receiptData,
      password: env.APPLE_SHARED_SECRET, // You'll need to set this
      'exclude-old-transactions': true,
    });

    return response.data;
  }

  /**
   * Verify Android receipt with Google Play Store
   */
  private async verifyAndroidReceipt(receipt: AndroidReceiptData): Promise<VerificationResult> {
    try {
      // For Google Play verification, you would typically use Google Play Developer API
      // This requires OAuth2 authentication with service account

      const purchaseToken = receipt.purchaseTokenAndroid;
      const packageName = env.ANDROID_PACKAGE_NAME;

      if (!purchaseToken || !packageName) {
        throw new Error('Missing Android verification data');
      }

      // Simplified verification for now - in production you'd call:
      // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get

      // For now, we'll do basic validation and trust the client
      // In production, implement proper Google Play API verification

      return {
        isValid: true, // This should be based on actual Google Play API response
        productId: receipt.productId,
        transactionId: receipt.transactionId,
        platform: 'android',
        receiptData: receipt,
      };
    } catch (error) {
      console.error('Android receipt verification error:', error);
      return {
        isValid: false,
        productId: receipt.productId,
        transactionId: receipt.transactionId,
        platform: 'android',
      };
    }
  }

  /**
   * Create or update subscription in database
   */
  async createOrUpdateSubscription(
    userId: string,
    receipt: IOSReceiptData | AndroidReceiptData,
    platform: 'ios' | 'android',
    verificationResult: VerificationResult
  ): Promise<any> {
    try {
      // Extract plan from product ID
      const plan = this.extractPlanFromProductId(receipt.productId);

      // Calculate subscription period
      const { startDate, endDate } = this.calculateSubscriptionPeriod(plan);

      // Check if subscription already exists
      const { data: existingSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('transaction_id', receipt.transactionId)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { data: updatedSubscription, error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return updatedSubscription;
      } else {
        // Create new subscription
        const { data: newSubscription, error } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            platform,
            product_id: receipt.productId,
            transaction_id: receipt.transactionId,
            original_transaction_id:
              verificationResult.originalTransactionId || receipt.transactionId,
            receipt_data: JSON.stringify(verificationResult.receiptData),
            plan,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return newSubscription;
      }
    } catch (error) {
      console.error('Failed to create/update subscription:', error);
      throw error;
    }
  }

  /**
   * Extract subscription plan from product ID
   */
  private extractPlanFromProductId(productId: string): string {
    if (productId.includes('weekly')) return 'weekly';
    if (productId.includes('yearly')) return 'yearly';
    return 'monthly'; // default
  }

  /**
   * Calculate subscription period dates
   */
  private calculateSubscriptionPeriod(plan: string): { startDate: Date; endDate: Date } {
    const startDate = new Date();
    const endDate = new Date();

    switch (plan) {
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Check if subscription is still valid
   */
  async validateSubscription(userId: string): Promise<boolean> {
    try {
      const { data: subscription, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to validate subscription:', error);
        return false;
      }

      if (!subscription) {
        return false;
      }

      // Check if subscription has expired
      const endDate = new Date(subscription.current_period_end);
      return endDate > new Date();
    } catch (error) {
      console.error('Subscription validation error:', error);
      return false;
    }
  }
}

export const iapService = new IAPService();
