-- Update RLS policies for reviews to ensure only purchasers can review products

-- Drop the existing policy for inserting reviews
DROP POLICY IF EXISTS "Users can insert their own reviews" ON product_reviews;

-- Create new policy: Users can only insert reviews for products they have purchased
CREATE POLICY "Users can insert reviews for purchased products only" ON product_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND has_purchased_product(auth.uid(), product_id)
    );

-- Update the existing update policy to also check purchase status
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;

CREATE POLICY "Users can update their own purchased product reviews" ON product_reviews
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND has_purchased_product(auth.uid(), product_id)
    );
