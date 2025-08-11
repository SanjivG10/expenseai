-- Create user_preferences table for storing budget limits and notification settings

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Budget limits (in cents to avoid floating point issues)
  daily_budget INTEGER DEFAULT NULL,      -- Daily spending limit in cents
  weekly_budget INTEGER DEFAULT NULL,     -- Weekly spending limit in cents  
  monthly_budget INTEGER DEFAULT NULL,    -- Monthly spending limit in cents
  
  -- Notification settings
  notifications_enabled BOOLEAN DEFAULT false,
  daily_notifications BOOLEAN DEFAULT true,
  weekly_notifications BOOLEAN DEFAULT true,
  monthly_notifications BOOLEAN DEFAULT true,
  
  -- Notification times (stored as minutes from midnight, 0-1439)
  daily_notification_time INTEGER DEFAULT 1260,    -- 21:00 (9 PM) - before sleep
  weekly_notification_time INTEGER DEFAULT 600,     -- 10:00 AM Sunday morning
  monthly_notification_time INTEGER DEFAULT 600,    -- 10:00 AM on last day of month
  
  -- Currency preference
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Onboarding completion
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id (one preference record per user)
CREATE UNIQUE INDEX user_preferences_user_id_idx ON user_preferences(user_id);

-- Create RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own preferences
CREATE POLICY "Users can access their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Insert default preferences for existing users (if any)
INSERT INTO user_preferences (user_id, onboarding_completed)
SELECT id, false FROM auth.users
ON CONFLICT (user_id) DO NOTHING;