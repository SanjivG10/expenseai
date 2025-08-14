-- Create RevenueCat subscriptions table
CREATE TABLE IF NOT EXISTS revenuecat_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    revenuecat_user_id VARCHAR(255) NOT NULL,
    entitlement_id VARCHAR(100) NOT NULL DEFAULT 'premium',
    product_id VARCHAR(255) NOT NULL,
    store VARCHAR(50) NOT NULL CHECK (store IN ('app_store', 'play_store')),
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('weekly', 'monthly', 'yearly')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    transaction_id VARCHAR(255),
    original_transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    UNIQUE(user_id, revenuecat_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_user_id ON revenuecat_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_revenuecat_user_id ON revenuecat_subscriptions(revenuecat_user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_status ON revenuecat_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_product_id ON revenuecat_subscriptions(product_id);

-- Add RLS policies
ALTER TABLE revenuecat_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON revenuecat_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage subscriptions" ON revenuecat_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Note: RevenueCat user ID is now stored in auth.users user_metadata.revenuecat_user_id
-- No need to add columns to custom users table since we use Supabase Auth