-- Insert sample products
INSERT INTO products (name, description, price, category, occasion, season, stock_quantity, image_url, sizes, colors) VALUES
-- Men's Collection
('Classic Cotton Shirt', 'Premium cotton shirt perfect for formal occasions', 49.99, 'men', 'formal', 'all-season', 50, '/placeholder.svg?height=400&width=400', ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['White', 'Blue', 'Black']),
('Casual Denim Jeans', 'Comfortable denim jeans for everyday wear', 59.99, 'men', 'casual', 'all-season', 75, '/placeholder.svg?height=400&width=400', ARRAY['30', '32', '34', '36', '38'], ARRAY['Blue', 'Black', 'Grey']),
('Wedding Sherwani', 'Elegant traditional sherwani for weddings', 299.99, 'men', 'wedding', 'all-season', 20, '/placeholder.svg?height=400&width=400', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Gold', 'Cream', 'Maroon']),
('Sports Track Suit', 'Breathable tracksuit for athletic activities', 79.99, 'men', 'sports', 'all-season', 60, '/placeholder.svg?height=400&width=400', ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Black', 'Navy', 'Grey']),
('Summer Polo Shirt', 'Light and comfortable polo for summer', 39.99, 'men', 'casual', 'summer', 80, '/placeholder.svg?height=400&width=400', ARRAY['S', 'M', 'L', 'XL'], ARRAY['White', 'Navy', 'Red']),

-- Women's Collection
('Elegant Evening Dress', 'Beautiful evening dress for special occasions', 149.99, 'women', 'party', 'all-season', 30, '/placeholder.svg?height=400&width=400', ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Red', 'Navy']),
('Casual Summer Dress', 'Light and breezy dress perfect for summer', 69.99, 'women', 'casual', 'summer', 65, '/placeholder.svg?height=400&width=400', ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Floral', 'White', 'Yellow']),
('Traditional Saree', 'Exquisite traditional saree for weddings', 199.99, 'women', 'wedding', 'all-season', 25, '/placeholder.svg?height=400&width=400', ARRAY['One Size'], ARRAY['Red', 'Gold', 'Green', 'Blue']),
('Formal Blazer', 'Professional blazer for office wear', 129.99, 'women', 'formal', 'all-season', 40, '/placeholder.svg?height=400&width=400', ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Navy', 'Grey']),
('Winter Coat', 'Warm and stylish winter coat', 189.99, 'women', 'casual', 'winter', 35, '/placeholder.svg?height=400&width=400', ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Camel', 'Navy']),

-- Children's Collection
('Kids Party Dress', 'Adorable party dress for little girls', 49.99, 'child', 'party', 'all-season', 45, '/placeholder.svg?height=400&width=400', ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y'], ARRAY['Pink', 'Purple', 'White']),
('Boys Casual T-Shirt', 'Comfortable cotton t-shirt for boys', 24.99, 'child', 'casual', 'summer', 90, '/placeholder.svg?height=400&width=400', ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'], ARRAY['Blue', 'Red', 'Green']),
('Kids Winter Jacket', 'Warm jacket for cold weather', 79.99, 'child', 'casual', 'winter', 50, '/placeholder.svg?height=400&width=400', ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y'], ARRAY['Navy', 'Red', 'Black']),
('Traditional Kids Kurta', 'Traditional outfit for special occasions', 59.99, 'child', 'traditional', 'all-season', 40, '/placeholder.svg?height=400&width=400', ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y'], ARRAY['White', 'Cream', 'Blue']),
('Sports Shorts Set', 'Active wear set for kids', 34.99, 'child', 'sports', 'summer', 70, '/placeholder.svg?height=400&width=400', ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'], ARRAY['Black', 'Blue', 'Grey']);
