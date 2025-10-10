-- Create admin user with email tanmoykumar027@gmail.com
-- Note: This assumes the user has already signed up through the app
-- If not, you need to create the auth.users entry first through Supabase Auth

-- Update existing user to admin role (if user exists)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'tanmoykumar027@gmail.com';

-- If the user doesn't exist yet, this will create the profile when they sign up
-- The trigger will automatically create the profile, then you can run this:
-- UPDATE profiles SET role = 'admin' WHERE email = 'tanmoykumar027@gmail.com';

-- Verify admin user
SELECT id, email, role, created_at 
FROM profiles 
WHERE email = 'tanmoykumar027@gmail.com';
