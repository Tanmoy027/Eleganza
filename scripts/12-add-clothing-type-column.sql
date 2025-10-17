-- Migration script to add clothing_type column to existing products table
-- This script can be run on existing database without affecting current data

-- Step 1: Add the clothing_type column as nullable first
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS clothing_type TEXT;

-- Step 2: Update existing products with a default clothing_type based on category
-- You can customize these defaults or update them manually later in your admin panel
UPDATE products 
SET clothing_type = CASE 
  WHEN category = 'women' THEN 'tops'
  WHEN category = 'men' THEN 't-shirts'
  WHEN category = 'child' THEN 'kids-t-shirts'
  ELSE 'tops'
END 
WHERE clothing_type IS NULL;

-- Step 3: Add the constraint with all clothing types
ALTER TABLE products 
ADD CONSTRAINT clothing_type_check 
CHECK (clothing_type IN (
  -- Women's clothing types
  'saree', 'salwar-kameez', 'kurti', 'kurtas', 'tops', 'blouses', 'maxi-dresses', 'gowns', 'skirts', 'palazzos', 
  'nightwear', 'loungewear', 'hijab', 'dupatta', 'scarves', 'unstitched-cloth', 'western-wear-jackets', 'jumpsuits',
  -- Men's clothing types
  'formal-shirt', 'casual-shirt', 'panjabi-kurta', 't-shirts', 'polo-shirts', 'pants', 'trousers', 'jeans', 'denim', 
  'mens-loungewear', 'sleepwear', 'jacket', 'coat', 'sweater', 'ethnic-outfits', 'formal-suits', 'blazers',
  -- Children's clothing types
  'boys-shirts', 'girls-tops', 'kids-t-shirts', 'boys-pants', 'girls-dresses', 'kids-shorts', 'school-uniforms', 
  'kids-ethnic-wear', 'baby-rompers', 'kids-sleepwear', 'kids-jackets', 'kids-traditional', 'kids-casual', 'kids-formal'
));

-- Step 4: Make the column NOT NULL after all existing records have values
ALTER TABLE products 
ALTER COLUMN clothing_type SET NOT NULL;

-- Step 5: Add index for better performance on clothing_type queries
CREATE INDEX IF NOT EXISTS idx_products_clothing_type ON products(clothing_type);

-- Step 6: Add combined index for category and clothing_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_category_clothing_type ON products(category, clothing_type);

-- Verification query (optional - you can run this to check the update)
-- SELECT category, clothing_type, COUNT(*) as count 
-- FROM products 
-- GROUP BY category, clothing_type 
-- ORDER BY category, clothing_type;
