-- Fix the order tracking RLS issue by making the trigger function SECURITY DEFINER
-- This allows the trigger to bypass RLS policies when creating tracking entries

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS track_order_changes ON orders;
DROP FUNCTION IF EXISTS add_order_tracking();

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_order_tracking()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO order_tracking (order_id, status, message)
    VALUES (NEW.id, NEW.status, 'Order created');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO order_tracking (order_id, status, message)
    VALUES (NEW.id, NEW.status, 'Order status updated to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER track_order_changes
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION add_order_tracking();

-- Also add a policy to allow the system to insert order tracking
DROP POLICY IF EXISTS "System can create order tracking" ON order_tracking;
CREATE POLICY "System can create order tracking" ON order_tracking
  FOR INSERT WITH CHECK (true);
