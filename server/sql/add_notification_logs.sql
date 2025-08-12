-- Add notification logs table to prevent duplicate notifications after server restarts
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('daily', 'weekly', 'monthly')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timezone VARCHAR(50),
  notification_time INTEGER, -- minutes since midnight
  UNIQUE(user_id, notification_type, DATE(sent_at))
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_date ON notification_logs(user_id, notification_type, DATE(sent_at));
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Add comment for documentation
COMMENT ON TABLE notification_logs IS 'Tracks sent notifications to prevent duplicates after server restarts';
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of notification: daily, weekly, or monthly';
COMMENT ON COLUMN notification_logs.notification_time IS 'Time in minutes since midnight when notification was scheduled';
