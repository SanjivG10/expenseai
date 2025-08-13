-- Add item_breakdowns column to expenses table
-- This will store an array of items with quantity, price, and name

ALTER TABLE expenses 
ADD COLUMN item_breakdowns JSONB DEFAULT '[]'::jsonb;

-- Create a GIN index for better JSONB query performance
CREATE INDEX IF NOT EXISTS idx_expenses_item_breakdowns 
ON expenses USING GIN (item_breakdowns);

-- Add a check constraint to ensure item_breakdowns is an array
ALTER TABLE expenses 
ADD CONSTRAINT item_breakdowns_is_array 
CHECK (jsonb_typeof(item_breakdowns) = 'array');