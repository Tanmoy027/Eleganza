-- Complete discount system setup for products table

-- Add discount fields to products table if they don't exist
DO $$ 
BEGIN
    -- Check if discount_price column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'discount_price') THEN
        ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) DEFAULT NULL;
    END IF;
    
    -- Check if discount_percentage column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'discount_percentage') THEN
        ALTER TABLE products ADD COLUMN discount_percentage INTEGER DEFAULT NULL;
    END IF;
    
    -- Check if is_on_discount column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'is_on_discount') THEN
        ALTER TABLE products ADD COLUMN is_on_discount BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN products.discount_price IS 'Discounted price of the product (optional)';
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN products.is_on_discount IS 'Flag to indicate if product has active discount';

-- Add/update check constraints
DO $$
BEGIN
    -- Drop existing constraints if they exist
    BEGIN
        ALTER TABLE products DROP CONSTRAINT IF EXISTS discount_percentage_check;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE products DROP CONSTRAINT IF EXISTS discount_price_check;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
    
    -- Add new constraints
    ALTER TABLE products 
    ADD CONSTRAINT discount_percentage_check 
    CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));
    
    ALTER TABLE products 
    ADD CONSTRAINT discount_price_check 
    CHECK (discount_price IS NULL OR discount_price < price);
END $$;

-- Create function to automatically calculate discount values
CREATE OR REPLACE FUNCTION calculate_discount_values()
RETURNS TRIGGER AS $$
BEGIN
    -- If discount_percentage is set, calculate discount_price
    IF NEW.discount_percentage IS NOT NULL AND NEW.discount_percentage > 0 AND NEW.price IS NOT NULL THEN
        NEW.discount_price := ROUND(NEW.price - (NEW.price * NEW.discount_percentage / 100.0), 2);
        NEW.is_on_discount := TRUE;
    -- If discount_price is set, calculate discount_percentage
    ELSIF NEW.discount_price IS NOT NULL AND NEW.discount_price > 0 AND NEW.price IS NOT NULL AND NEW.discount_price < NEW.price THEN
        NEW.discount_percentage := ROUND(((NEW.price - NEW.discount_price) / NEW.price) * 100);
        NEW.is_on_discount := TRUE;
    -- If neither is set or invalid values, clear discount
    ELSE
        NEW.discount_price := NULL;
        NEW.discount_percentage := NULL;
        NEW.is_on_discount := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate discount values
DROP TRIGGER IF EXISTS trigger_calculate_discount_values ON products;
CREATE TRIGGER trigger_calculate_discount_values
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_discount_values();

-- Update RLS policies to include new columns
-- Drop existing policies and recreate to include new columns
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;

CREATE POLICY "Allow public read access to active products" ON products
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to products" ON products
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- Create index for efficient queries on discounted products
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(is_on_discount, is_active) WHERE is_on_discount = true;

-- Sample data to test discount functionality (optional)
-- INSERT INTO products (name, description, price, discount_percentage, category, stock_quantity, is_active)
-- VALUES ('Test Discount Product', 'A test product with discount', 100.00, 20, 'women', 10, true)
-- ON CONFLICT DO NOTHING;

COMMIT;
