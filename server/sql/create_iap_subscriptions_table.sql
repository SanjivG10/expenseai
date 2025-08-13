-- Create IAP subscriptions table that works alongside existing Stripe subscriptions

-- First, let's modify the existing user_subscriptions table to support IAP
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('stripe', 'ios', 'android')),
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS original_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS receipt_data JSONB;

-- Make stripe fields optional for IAP subscriptions
ALTER TABLE user_subscriptions 
ALTER COLUMN stripe_customer_id DROP NOT NULL,
ALTER COLUMN stripe_subscription_id DROP NOT NULL;

-- Add indexes for IAP fields
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_transaction_id ON user_subscriptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_platform ON user_subscriptions(platform);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_product_id ON user_subscriptions(product_id);

-- Add unique constraint for IAP transactions to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_unique_transaction 
ON user_subscriptions(user_id, transaction_id, platform) 
WHERE transaction_id IS NOT NULL;

-- Add a comment to explain the table structure
COMMENT ON TABLE user_subscriptions IS 'Unified table for both Stripe and In-App Purchase subscriptions. Stripe subscriptions use stripe_* fields, IAP subscriptions use platform, product_id, transaction_id fields.';

-- Create a function to get active subscription for user
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  platform TEXT,
  plan TEXT,
  status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.user_id,
    us.platform,
    us.plan,
    us.status,
    us.current_period_start,
    us.current_period_end,
    us.created_at
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    AND us.current_period_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;

-- Create a function to check if user has premium access
CREATE OR REPLACE FUNCTION user_has_premium_access(p_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = p_user_id 
      AND status = 'active' 
      AND current_period_end > NOW()
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;