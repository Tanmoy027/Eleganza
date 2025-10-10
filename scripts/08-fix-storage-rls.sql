-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create simple, clear policies for productimage bucket
CREATE POLICY "productimage_public_read" 
  ON storage.objects FOR SELECT 
  TO anon, authenticated 
  USING (bucket_id = 'productimage');

CREATE POLICY "productimage_admin_write" 
  ON storage.objects FOR ALL 
  TO authenticated 
  USING (
    bucket_id = 'productimage' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure proper grants
GRANT SELECT ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
