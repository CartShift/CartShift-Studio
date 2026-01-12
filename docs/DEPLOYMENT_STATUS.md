# Firebase Deployment Status

## ✅ Completed Steps

1. **Firebase Project Created**: `cartshiftstudio`
   - Project ID: cartshiftstudio
   - Console: https://console.firebase.google.com/project/cartshiftstudio/overview

2. **Firebase CLI**: Installed and logged in ✅

3. **Project Configuration**:
   - `.firebaserc` configured with project ID ✅
   - `firebase.json` configured for hosting and functions ✅

4. **Next.js Configuration**:
   - Static export enabled in `next.config.mjs` ✅

5. **Functions Dependencies**: Installed ✅

## ⚠️ Required Actions Before Deployment

### 1. Upgrade to Blaze Plan (REQUIRED for Cloud Functions)
**Status**: ⚠️ Not upgraded yet

Cloud Functions require the Blaze (pay-as-you-go) plan. The free Spark plan only supports Hosting.

**Action Required**:
1. Visit: https://console.firebase.google.com/project/cartshiftstudio/usage/details
2. Click "Upgrade" to Blaze plan
3. Complete the upgrade process

**Note**: Blaze plan has a free tier that covers most small projects. You only pay for what you use beyond the free tier.

### 2. Enable Firestore Database
**Status**: ⚠️ Not enabled yet

The contact form function requires Firestore to store submissions.

**Action Required**:
1. Visit: https://console.firebase.google.com/project/cartshiftstudio/firestore
2. Click "Create database"
3. Select "Start in production mode" or "Start in test mode" (test mode is fine for development)
4. Choose location: `us-central1` (recommended)
5. Click "Enable"

**Alternative (via CLI after Blaze upgrade)**:
```bash
firebase firestore:databases:create --location us-central1 --database (default)
```

### 3. Enable Required APIs
**Status**: ⚠️ Will be auto-enabled during deployment

These APIs will be automatically enabled when you deploy:
- Cloud Functions API
- Cloud Build API
- Artifact Registry API

**Manual enable (if needed)**:
   - Firestore API: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=cartshiftstudio

### 4. Configure Resend for Email Notifications
**Status**: ⚠️ Configure when ready

Email notifications use **Resend** (modern email API, 3,000/month free):

1. **Create Resend Account**:
   - Sign up at: https://resend.com
   - Create an API key in the dashboard

2. **Verify Domain (Recommended)**:
   - Add your domain in Resend dashboard
   - Configure DNS records provided

3. **Set Firebase Functions Secrets**:
```bash
firebase functions:secrets:set RESEND_API_KEY
# Paste your API key when prompted

firebase functions:secrets:set CONTACT_EMAIL="hello@cart-shift.com"
```

## 📋 Deployment Steps (After Upgrades)

### Step 1: Deploy Functions
```bash
firebase deploy --only functions
```

After deployment, you'll get a function URL like:
`https://us-central1-cartshiftstudio.cloudfunctions.net/contactForm`

### Step 2: Create Environment Variables File
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SITE_URL=https://cart-shift.com
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://us-central1-cartshiftstudio.cloudfunctions.net/contactForm
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Replace `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` with your actual function URL from Step 1.

### Step 3: Build Next.js Application
```bash
npm run export
```

This will:
- Build the Next.js app
- Export static files to the `out` directory
- Validate environment variables

### Step 4: Deploy Hosting
```bash
firebase deploy --only hosting
```

### Step 5: Deploy Everything (Alternative)
```bash
firebase deploy
```

## 🎯 Quick Deployment Checklist

- [ ] Upgrade to Blaze plan
- [ ] Enable Firestore database
- [ ] Deploy functions
- [ ] Get function URL
- [ ] Create `.env.local` with function URL
- [ ] Build Next.js app (`npm run export`)
- [ ] Deploy hosting
- [ ] (Optional) Configure Gmail for email notifications
- [ ] Test the deployed site
- [ ] Test contact form submission

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/project/cartshiftstudio/overview
- Upgrade to Blaze: https://console.firebase.google.com/project/cartshiftstudio/usage/details
-   Firebase Console: https://console.firebase.google.com/project/cartshiftstudio/overview
-   Upgrade to Blaze: https://console.firebase.google.com/project/cartshiftstudio/usage/details
-   Firestore Setup: https://console.firebase.google.com/project/cartshiftstudio/firestore
-   Hosting: https://console.firebase.google.com/project/cartshiftstudio/hosting
-   Functions: https://console.firebase.google.com/project/cartshiftstudio/functions

## 📝 Notes

-   The site will be available at: `https://cart-shift.com` (or your custom domain)
    -   Must match exactly: `https://cart-shift.com/portal/oauth-callback`
-   Functions are deployed to: `us-central1` region
-   Static export is configured, so the site is fully static (no SSR)
-   Contact form submissions are stored in Firestore collection: `contact_submissions`
