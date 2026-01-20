# Firebase App Hosting Deployment Guide

## Overview

CartShift Studio uses **Firebase App Hosting** for deployment. This runs Next.js as a server (standalone mode) on Google Cloud Run, providing full SSR, API routes, and dynamic routing support.

## Pre-Deployment Checklist

1. **Environment Variables**
   - Configure secrets in `apphosting.yaml` or Firebase Console
   - Required: Firebase config, site URL, reCAPTCHA key

2. **Build Test**

   ```bash
   pnpm run build
   pnpm start
   ```

3. **Firestore & Storage Rules**
   ```bash
   pnpm run deploy:rules
   ```

## Firebase App Hosting Configuration

Configuration is in `apphosting.yaml`:

```yaml
runConfig:
  minInstances: 0
  maxInstances: 10
  concurrency: 80
  cpu: 1
  memoryMiB: 1024

env:
  - variable: NEXT_PUBLIC_SITE_URL
    value: https://cart-shift.com
    availability:
      - BUILD
      - RUNTIME
  # ... other env vars
```

## Deployment

Firebase App Hosting deploys automatically on push to your connected branch. Manual deployment:

```bash
firebase apphosting:backends:create
```

## Email Setup (Resend)

### 1. Create Resend Account

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Create an API key (starts with `re_`)

### 2. Verify Your Domain

1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `cart-shift.com`)
3. Add the DNS records Resend provides

### 3. Set Firebase Functions Secrets

```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set CONTACT_EMAIL="hello@cart-shift.com"
```

## Cloud Functions

Deploy functions separately:

```bash
pnpm run deploy:functions
```

Functions require the **Blaze (pay-as-you-go) plan**.

## Custom Domain Setup

1. Go to Firebase Console → App Hosting
2. Add custom domain
3. Follow DNS configuration instructions
4. SSL is automatically provisioned

## Post-Deployment

1. **Verify Deployment**
   - Check all pages load correctly
   - Test dynamic routes (requests, pricing, etc.)
   - Test form submissions
   - Verify analytics tracking

2. **SEO Verification**
   - Submit sitemap to Google Search Console
   - Verify robots.txt is accessible

3. **Monitoring**
   - Use Firebase Console for app metrics
   - Monitor Cloud Run logs
   - Check function logs: `firebase functions:log`

## Troubleshooting

### Build Errors

- Check Node.js version (20+)
- Clear `.next` folder: `rm -rf .next`
- Run `pnpm run lint`

### Dynamic Routes 404

- Ensure `dynamicParams` is not set to `false`
- Check route params match file structure

### Environment Variables

- Verify secrets are set in Firebase Console
- Check `availability` includes both BUILD and RUNTIME
