-- Add discount fields to products table
ALTER TABLE products 
ADD COLUMN discount_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN discount_percentage INTEGER DEFAULT NULL,
ADD COLUMN is_on_discount BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN products.discount_price IS 'Discounted price of the product (optional)';
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN products.is_on_discount IS 'Flag to indicate if product has active discount';

-- Add check constraint to ensure discount percentage is between 0 and 100
ALTER TABLE products 
ADD CONSTRAINT discount_percentage_check 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add check constraint to ensure discount price is less than original price
ALTER TABLE products 
ADD CONSTRAINT discount_price_check 
CHECK (discount_price IS NULL OR discount_price < price);

-- Update RLS policies to include new columns
-- Drop existing policy and recreate to include new columns
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;

CREATE POLICY "Allow public read access to active products" ON products
    FOR SELECT 
    USING (is_active = true);

-- Ensure authenticated users can still manage products
DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;

CREATE POLICY "Allow authenticated users full access to products" ON products
    FOR ALL 
    USING (auth.role() = 'authenticated');
