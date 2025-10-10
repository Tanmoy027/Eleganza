-- Create admin user with email tanmoykumar027@gmail.com
-- First, you need to sign up with this email through the app
-- Then run this script to upgrade the user to admin

-- Update the user's role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'tanmoykumar027@gmail.com';

-- Verify the admin user was created
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'tanmoykumar027@gmail.com';
