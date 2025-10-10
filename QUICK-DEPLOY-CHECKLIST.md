# 🚀 Quick Deployment Checklist

## Before You Deploy - Fix Localhost Issues

### ✅ Step 1: Set Your Domain
Copy `.env.example` to `.env.local` and update:

```bash
# Replace 'yourdomain.com' with your actual domain
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
```

### ✅ Step 2: Platform Setup

#### For Vercel:
1. Go to project settings → Environment Variables
2. Add: `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
3. Redeploy

#### For Netlify:
1. Site settings → Environment variables
2. Add: `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
3. Redeploy

### ✅ Step 3: Supabase Configuration
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://yourdomain.com`
3. Redirect URLs: Add `https://yourdomain.com/checkout/success`

### ✅ Step 4: Stripe Configuration
1. Stripe Dashboard → Webhooks
2. Update endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Use live API keys for production

## 🎯 What This Fixes

After deployment with proper configuration:

- ✅ Payment success redirects to your website (not localhost)
- ✅ Email verification links go to your domain
- ✅ Password reset links work correctly
- ✅ All authentication flows redirect properly
- ✅ No more Stripe "invalid URL" errors

## 🔍 Testing Your Setup

1. Deploy your website
2. Make a test purchase
3. Check that success page redirects to your domain
4. Test email verification (create new account)
5. Verify all links point to your domain (not localhost)

## 🆘 If You Still See Localhost

1. Check your hosting platform's environment variables
2. Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
3. Redeploy after adding environment variables
4. Check browser console for any configuration warnings

Your website should now work perfectly in production! 🎉
