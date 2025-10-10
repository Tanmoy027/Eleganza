-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order tracking" ON order_tracking;

-- Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies using the function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage order tracking" ON order_tracking
  FOR ALL USING (is_admin(auth.uid()));
