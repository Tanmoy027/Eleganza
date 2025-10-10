# Production Deployment Guide

## Fixing Localhost Redirect Issues

When deploying your e-commerce website to production, you need to ensure that all redirects (payment success, email verification, etc.) point to your actual domain instead of localhost.

### 🚨 CRITICAL: Set Your Production Domain

The most important step is setting `NEXT_PUBLIC_SITE_URL` to your actual domain:

### 1. Environment Variables Setup

Set these environment variables in your production environment:

```bash
# 🎯 MOST IMPORTANT: Your actual production domain
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# This ensures:
# ✅ Stripe redirects users back to your site after payment
# ✅ Email verification links go to your domain
# ✅ Password reset links work correctly
# ✅ All authentication flows redirect properly

# Your Supabase project details
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe keys (use LIVE keys for production)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Supabase Configuration

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `https://yourdomain.com`
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/checkout/success`

### 3. Stripe Configuration

In your Stripe dashboard:

1. Go to **Webhooks**
2. Update webhook endpoint to: `https://yourdomain.com/api/webhooks/stripe`
3. Ensure you're using **Live API keys** for production

### 4. Deployment Platforms

#### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Vercel automatically sets `VERCEL_URL` - our code will use this as fallback

#### Netlify
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

#### Other Platforms
Make sure to set the `NEXT_PUBLIC_SITE_URL` environment variable to your production domain.

### 5. Testing the Deployment

After deployment, test these flows:

1. **Email Verification**: 
   - Sign up with a new account
   - Check that email verification link redirects to your domain, not localhost

2. **Payment Flow**:
   - Add items to cart
   - Complete checkout
   - Verify success page redirects to your domain

3. **Auth Redirects**:
   - Login/logout flows
   - Admin dashboard access

### 6. Common Issues and Solutions

#### Issue: Still redirecting to localhost
**Solution**: Double-check that `NEXT_PUBLIC_SITE_URL` is set correctly in your production environment.

#### Issue: Email verification links go to localhost
**Solution**: Update the Site URL in Supabase dashboard and ensure `NEXT_PUBLIC_SITE_URL` is set.

#### Issue: Stripe webhooks failing
**Solution**: Update webhook endpoint URL in Stripe dashboard to your production domain.

#### Issue: CORS errors
**Solution**: Add your production domain to allowed origins in Supabase dashboard.

### 7. Environment Variable Priority

The system checks for URLs in this order:
1. `NEXT_PUBLIC_SITE_URL` (highest priority)
2. `VERCEL_URL` (for Vercel deployments)
3. Request headers (automatic detection)
4. `window.location.origin` (client-side)
5. `http://localhost:3000` (development fallback)

### 8. Security Checklist

- [ ] Using LIVE Stripe keys in production
- [ ] `NEXT_PUBLIC_SITE_URL` points to HTTPS domain
- [ ] Supabase Site URL updated
- [ ] Webhook endpoints updated
- [ ] RLS policies enabled in Supabase
- [ ] Environment variables secured

## Quick Fix Commands

If you're still seeing localhost issues after deployment, run these checks:

```bash
# Check if environment variables are set correctly
echo $NEXT_PUBLIC_SITE_URL

# Verify in your app
console.log(process.env.NEXT_PUBLIC_SITE_URL)
```

Remember: After changing environment variables, you need to redeploy your application for the changes to take effect.
