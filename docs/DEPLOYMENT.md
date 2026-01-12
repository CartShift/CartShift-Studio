# Firebase Deployment Guide

## Pre-Deployment Checklist

1. **Environment Variables** (Required)
   - Set `NEXT_PUBLIC_SITE_URL` to your production domain (required)
   - Set `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` to your Cloud Function URL (required)
   - Set `NEXT_PUBLIC_GA_ID` for Google Analytics (optional)

   **Note**: Environment variables are validated at startup. Missing required variables will cause build failures.

2. **Build Test**
   ```bash
   npm run build
   npm start
   ```
   Verify the production build works locally.

3. **Content Review**
   - Update all placeholder content
   - Verify all links
   - Check contact information
   - Review blog posts

## Firebase Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Project
```bash
firebase init
```
Select:
- Hosting
- Functions
- Use an existing project (or create new)
- Select your project

### 4. Configure Firebase Project
Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Email Setup (Resend)

### 1. Create Resend Account
1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Go to API Keys and create a new key
3. Copy the API key (starts with `re_`)

### 2. Verify Your Domain (Recommended)
1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `cart-shift.com`)
3. Add the DNS records Resend provides
4. Wait for verification (usually < 1 hour)

### 3. Set Firebase Functions Secrets
```bash
firebase functions:secrets:set RESEND_API_KEY
# Paste your API key when prompted

firebase functions:secrets:set CONTACT_EMAIL="hello@cart-shift.com"
```

### Email Templates
Templates are in `functions/emails/`:
- `base.html` - Base layout
- `new_request.html` - New request notification
- `status_update.html` - Status changes
- `quote_received.html` - Quote notifications
- `payment_receipt.html` - Payment confirmations
- `team_invite.html` - Team invitations
- `milestone_completed.html` - Milestone completions
- `new_comment.html` - Comment notifications

## Deployment Steps

### ⚠️ IMPORTANT: Upgrade to Blaze Plan
**Cloud Functions require the Blaze (pay-as-you-go) plan.**
- Visit: https://console.firebase.google.com/project/cartshiftstudio/usage/details
- Upgrade your project to enable Cloud Functions
- The free Spark plan only supports Hosting, not Functions

### 1. Enable Firestore Database
```bash
firebase firestore:databases:create --location us-central1
```

### 2. Deploy Functions First (to get the function URL)
```bash
firebase deploy --only functions
```
After deployment, note the function URL (e.g., `https://us-central1-cart-shift.cloudfunctions.net/contactForm`)

### 3. Set Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SITE_URL=https://cart-shift.com
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://us-central1-cart-shift.cloudfunctions.net/contactForm
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
Replace the function URL with your actual deployed function URL.

### 4. Build and Export Next.js Application
Next.js is configured to export as static site for Firebase Hosting:
```bash
npm run export
```
This runs `next build` which exports to the `out` directory (configured in `next.config.mjs`).

### 5. Deploy Hosting
```bash
firebase deploy --only hosting
```

### 6. Deploy Everything (after functions are deployed)
```bash
firebase deploy
```

## Firebase Hosting Configuration

The `firebase.json` is already configured. For Next.js with SSR, you have two options:

### Option A: Static Export (Current)
- Export Next.js as static files
- Deploy to Firebase Hosting
- Forms call Cloud Functions

### Option B: SSR with Cloud Functions
- Use Firebase Functions to run Next.js server
- More complex but full SSR support
- Requires additional configuration

## Custom Domain Setup

1. **Add Domain in Firebase Console**
   - Go to Firebase Console → Hosting
   - Click "Add custom domain"
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Firebase automatically provisions SSL certificates
   - Wait for certificate provisioning (can take a few hours)

## Post-Deployment

1. **Verify Deployment**
   - Check all pages load correctly
   - Test form submissions
   - Verify analytics tracking
   - Test mobile responsiveness

2. **SEO Verification**
   - Submit sitemap to Google Search Console
   - Verify robots.txt is accessible
   - Check meta tags with SEO tools

3. **Performance Monitoring**
   - Use Firebase Performance Monitoring
   - Monitor Core Web Vitals in Google Search Console
   - Set up error tracking in Firebase Console

4. **Cloud Functions Monitoring**
   - Monitor function logs: `firebase functions:log`
   - Check function metrics in Firebase Console
   - Set up alerts for errors

## Environment Variables Reference

### Local Development (.env.local)
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://us-central1-your-project.cloudfunctions.net/contactForm
```

### Firebase Functions Config
```bash
firebase functions:secrets:set RESEND_API_KEY
# Paste your Resend API key when prompted

firebase functions:secrets:set CONTACT_EMAIL="hello@yourdomain.com"
```

## Troubleshooting

### Build Errors
- Check Node.js version (should be 20+ for Functions)
- Clear `.next` folder and rebuild
- Check for TypeScript errors: `npm run lint`

### Form Submission Issues
- Verify Cloud Function is deployed
- Check function logs: `firebase functions:log`
- Verify Gmail app password is correct
- Check Firebase Functions config

### Hosting Issues
- Ensure `firebase.json` is configured correctly
- Check that build output is in correct directory
- Verify custom domain DNS settings

### Performance Issues
- Check image optimization
- Review bundle size
- Enable Firebase Hosting caching
- Use Firebase CDN for static assets
