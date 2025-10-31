-- Add lightweight gift support without schema changes
-- We will store gift-related fields inside orders.shipping_address JSONB
-- No new columns required. This script is informational only in case you want a check constraint.

-- Optionally add a generated boolean to quickly filter gift orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_gift boolean GENERATED ALWAYS AS ((shipping_address ? 'recipientName')::boolean) STORED;

-- Index to filter gifts fast
CREATE INDEX IF NOT EXISTS idx_orders_is_gift ON orders(is_gift);
