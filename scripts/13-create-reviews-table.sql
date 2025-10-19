-- Create reviews table and related functionality
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true, -- Admin can approve/disapprove reviews
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one review per user per product
  UNIQUE(product_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for reviews table
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON product_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies for reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approved reviews
CREATE POLICY "Users can view approved reviews" ON product_reviews
    FOR SELECT USING (is_approved = true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON product_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admins can view all reviews
CREATE POLICY "Admins can view all reviews" ON product_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can update any review (mainly for approval status)
CREATE POLICY "Admins can update any review" ON product_reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can delete any review
CREATE POLICY "Admins can delete any review" ON product_reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create a view for product review statistics
CREATE OR REPLACE VIEW product_review_stats AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    COALESCE(COUNT(pr.id), 0) as total_reviews,
    COALESCE(ROUND(AVG(pr.rating), 2), 0) as average_rating,
    COALESCE(COUNT(pr.id) FILTER (WHERE pr.rating = 5), 0) as five_star_count,
    COALESCE(COUNT(pr.id) FILTER (WHERE pr.rating = 4), 0) as four_star_count,
    COALESCE(COUNT(pr.id) FILTER (WHERE pr.rating = 3), 0) as three_star_count,
    COALESCE(COUNT(pr.id) FILTER (WHERE pr.rating = 2), 0) as two_star_count,
    COALESCE(COUNT(pr.id) FILTER (WHERE pr.rating = 1), 0) as one_star_count
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
GROUP BY p.id, p.name;

-- Grant access to the view
GRANT SELECT ON product_review_stats TO authenticated;
GRANT SELECT ON product_review_stats TO anon;

-- Function to check if user has purchased the product (for verified purchase badge)
CREATE OR REPLACE FUNCTION has_purchased_product(user_uuid UUID, product_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = user_uuid 
        AND oi.product_id = product_uuid 
        AND o.payment_status = 'paid'
        AND o.status IN ('delivered', 'confirmed', 'shipped')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION has_purchased_product(UUID, UUID) TO authenticated;
