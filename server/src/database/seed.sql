-- Default categories that will be created for new users
-- This data will be used by the API to populate categories for new users

-- Note: These are template categories, actual insertion happens via API
-- when a new user signs up to ensure proper user_id association

INSERT INTO categories (name, icon, color, is_default) VALUES
  ('Food & Drink', 'restaurant-outline', '#FF6B6B', true),
  ('Transport', 'car-outline', '#4ECDC4', true),  
  ('Shopping', 'bag-outline', '#45B7D1', true),
  ('Entertainment', 'play-circle-outline', '#96CEB4', true),
  ('Groceries', 'basket-outline', '#FFEAA7', true),
  ('Utilities', 'flash-outline', '#DDA0DD', true),
  ('Healthcare', 'medical-outline', '#98D8C8', true),
  ('Other', 'card-outline', '#F7DC6F', true);