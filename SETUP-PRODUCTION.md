# 🚀 Quick Setup Guide for Production Deployment

## Fix Localhost Redirect Issues

If your website redirects to `localhost` after payment or email verification, follow these steps:

### Step 1: Set Your Domain
Create a `.env.local` file (copy from `.env.example`) and set:

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Replace `yourdomain.com` with your actual domain.

### Step 2: Platform-Specific Setup

#### Vercel
1. In your Vercel dashboard, go to your project settings
2. Add environment variable: `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
3. Redeploy your project

#### Netlify
1. In your Netlify dashboard, go to Site settings → Environment variables
2. Add: `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
3. Redeploy your project

#### Other Hosts
Set the environment variable in your hosting platform's control panel.

### Step 3: Update Supabase Settings
1. Go to your Supabase project dashboard
2. Authentication → URL Configuration
3. Set Site URL to: `https://yourdomain.com`
4. Add Redirect URLs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/checkout/success`

### Step 4: Update Stripe Settings
1. Go to your Stripe dashboard
2. Webhooks section
3. Update endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`

## 🎉 That's it!
Your payment and email redirects will now point to your actual website instead of localhost.

---
For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
