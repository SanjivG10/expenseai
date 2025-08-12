-- Add timezone support to user_preferences table

ALTER TABLE user_preferences 
ADD COLUMN timezone TEXT DEFAULT 'America/New_York';

-- Add index for timezone-based queries
CREATE INDEX idx_user_preferences_timezone ON user_preferences(timezone);

-- Update notification time columns to be more descriptive
COMMENT ON COLUMN user_preferences.daily_notification_time IS 'Minutes from midnight in user timezone (default: 1260 = 9 PM)';
COMMENT ON COLUMN user_preferences.weekly_notification_time IS 'Minutes from midnight in user timezone (default: 600 = 10 AM)';
COMMENT ON COLUMN user_preferences.monthly_notification_time IS 'Minutes from midnight in user timezone (default: 600 = 10 AM)';