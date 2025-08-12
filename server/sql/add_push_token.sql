-- Add push token column to user_preferences table

ALTER TABLE user_preferences 
ADD COLUMN push_token TEXT;

-- Add index for faster queries when sending push notifications
CREATE INDEX idx_user_preferences_push_token ON user_preferences(push_token) WHERE push_token IS NOT NULL;

-- Add index for notification queries 
CREATE INDEX idx_user_preferences_notifications ON user_preferences(notifications_enabled, daily_budget, weekly_budget, monthly_budget) WHERE notifications_enabled = true;