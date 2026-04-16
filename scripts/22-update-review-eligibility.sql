-- Update review eligibility to require completed orders
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
          AND o.status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_purchased_product(UUID, UUID) TO authenticated;
