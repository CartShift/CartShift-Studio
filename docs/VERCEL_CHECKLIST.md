# Vercel Migration Checklist

## ✅ Completed Fixes (Already Applied)

### 1. Firebase Auth Handler Fix

- [x] **Middleware Configuration** - Fixed middleware to skip `__` paths completely
  - File: `middleware.ts`
  - Changed: `__` paths now return `NextResponse.next()` instead of processing through intlMiddleware

- [x] **Firebase Auth Iframe Route** - Removed restrictive headers
  - File: `app/__auth/iframe/route.ts`
  - Removed: `X-Frame-Options: SAMEORIGIN` to allow cross-origin Firebase Auth

- [x] **Vercel Configuration** - Added Firebase Auth routing
  - File: `vercel.json` (newly created)
  - Added rewrites for `__/auth/handler` and `__/auth/iframe`

### 2. Rate Limiting Fix

- [x] **Contact API Route** - Migrated from in-memory to Firestore-based rate limiting
  - File: `app/api/contact/route.ts`
  - Now uses: `@/lib/services/rate-limiter.ts` (distributed rate limiting)
  - Added: Proper rate limit headers (`X-RateLimit-*`)

### 3. Documentation

- [x] **Vercel Migration Guide** - Created comprehensive migration documentation
  - File: `docs/VERCEL_MIGRATION.md`
  - Covers: Firebase Auth proxy setup, environment variables, troubleshooting

- [x] **README Update** - Updated deployment section
  - File: `README.md`
  - Added: Vercel deployment commands, Firebase services overview

- [x] **Package Scripts** - Renamed Firebase deployment scripts
  - File: `package.json`
  - Changed: `deploy:rules` → `firebase:deploy:rules`
  - Changed: `deploy:functions` → `firebase:deploy:functions`
  - Added: `vercel:deploy` and `vercel:logs` scripts

## 📋 Remaining Tasks (You Need To Do)

### 1. Environment Variables (CRITICAL)

Add these variables to Vercel Dashboard → Project Settings → Environment Variables:

#### Public Variables (Client-side - must start with NEXT*PUBLIC*)

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cart-shift.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cartshiftstudio
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
NEXT_PUBLIC_SITE_URL=https://cart-shift.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
```

#### Private Variables (Server-side - DO NOT add NEXT*PUBLIC*)

```
RESEND_API_KEY=<your-resend-api-key>
CONTACT_EMAIL=hello@cart-shift.com
RECAPTCHA_SECRET_KEY=<your-recaptcha-secret-key>
```

### 2. Firebase Console Configuration

#### Authorized Domains

1. Go to [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/cartshiftstudio/authentication/settings)
2. Add these domains:
   - `cart-shift.com`
   - `www.cart-shift.com`
   - `portal.cart-shift.com`
   - `*.vercel.app` (for preview deployments)
   - `localhost` (for development)

#### Cloud Functions CORS

1. File: `functions/index.js`, lines 27-31
2. Add your Vercel domain to `allowedOrigins` array:
   ```javascript
   const allowedOrigins = [
     'https://cart-shift.com',
     'https://www.cart-shift.com',
     'https://portal.cart-shift.com',
     'https://your-vercel-project.vercel.app', // Add this
     'http://localhost:3000',
   ];
   ```
3. Redeploy functions: `pnpm run firebase:deploy:functions`

### 3. Firebase Hosting Setup

Even though your app is on Vercel, Firebase Hosting must be enabled for Firebase Auth to work.

1. **Check Firebase Hosting Status**

   ```bash
   firebase hosting:sites:list
   ```

   If no site exists, create one:

   ```bash
   firebase hosting:sites:create cartshiftstudio
   ```

2. **Keep Firebase Hosting Active**
   - No need to deploy your Next.js app to Firebase
   - Firebase Hosting is only needed for Firebase Auth internal endpoints
   - Your proxy routes forward requests to Firebase Hosting

### 4. Vercel Deployment

#### Initial Deployment

```bash
# Install Vercel CLI (if not already installed)
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Connect to Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Configure build settings:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
4. Set environment variables (see above)
5. Deploy

### 5. Domain Configuration

#### Add Custom Domains in Vercel

1. Go to Vercel Dashboard → Settings → Domains
2. Add domains:
   - `cart-shift.com`
   - `www.cart-shift.com`
   - `portal.cart-shift.com` (if using subdomain routing)
3. Update DNS records as instructed by Vercel

#### Subdomain Routing (Optional)

If using `portal.cart-shift.com` subdomain:

- Middleware is already configured (`ENABLE_PORTAL_SUBDOMAIN = true`)
- DNS should point `portal` subdomain to your Vercel deployment

If NOT using subdomain routing:

- Set `ENABLE_PORTAL_SUBDOMAIN = false` in `middleware.ts`, line 8
- Use path-based routing: `cart-shift.com/portal/`

### 6. Testing Checklist

After deployment, test these:

#### Firebase Auth

- [ ] Email/password sign in works
- [ ] Google sign in works (popup opens and authenticates)
- [ ] Password reset sends email
- [ ] User session persists after page refresh
- [ ] Logout works correctly

#### API Routes

- [ ] Contact form submits successfully
- [ ] Newsletter subscription works
- [ ] Store analysis works
- [ ] Rate limiting works (try submitting form 6+ times)
- [ ] CORS errors don't appear in console

#### Portal Features

- [ ] Login page loads
- [ ] Dashboard accessible after login
- [ ] Firestore data loads correctly
- [ ] File uploads work (Firebase Storage)
- [ ] All CRUD operations work

### 7. Firebase Cloud Functions Deployment

Deploy your backend functions to Firebase (they remain on Firebase):

```bash
# Deploy functions only
pnpm run firebase:deploy:functions
```

### 8. Firestore & Storage Rules

Deploy security rules:

```bash
# Deploy Firestore and Storage rules
pnpm run firebase:deploy:rules
```

## 🚨 Critical Issues to Verify

### Issue 1: 404 on /\_\_/auth/handler

**Status:** ✅ Fixed via middleware changes
**Test:** Try Google sign in - should work now

### Issue 2: CORS Errors on Firebase Functions

**Status:** ⏳ Requires manual update
**Fix:** Update `functions/index.js` allowedOrigins array
**Test:** Submit contact form and check console for CORS errors

### Issue 3: Rate Limiting Not Persisting

**Status:** ✅ Fixed via Firestore-based rate limiter
**Test:** Submit contact form multiple times across different browser sessions

## 📝 Post-Deployment Tasks

1. **Monitor Logs**

   ```bash
   # Vercel logs
   vercel logs

   # Firebase Functions logs
   firebase functions:log
   ```

2. **Set Up Analytics**
   - Google Analytics (if using GA_ID)
   - Vercel Analytics (automatically enabled)

3. **Error Tracking**
   - Consider integrating Sentry or Vercel Error Tracking
   - Firebase Crashlytics for client-side errors

4. **Performance Monitoring**
   - Vercel Speed Insights
   - Firebase Performance Monitoring

5. **SEO Verification**
   - Submit sitemap to Google Search Console
   - Verify robots.txt is accessible
   - Test Core Web Vitals

## 🔧 Troubleshooting

### Firebase Auth Still Not Working

1. Check `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` is set to `cart-shift.com`
2. Verify domain is added to Firebase Console → Authorized domains
3. Clear browser cache and cookies
4. Check browser console for specific error messages

### Cloud Functions Not Accessible

1. Verify `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` is correct
2. Check CORS settings in `functions/index.js`
3. Test function URL directly in browser

### Firestore Permission Errors

1. Verify user is authenticated
2. Check Firestore rules in Firebase Console
3. Ensure rules match your data structure

### Build Errors on Vercel

1. Check Node.js version (must be 20+)
2. Verify all environment variables are set
3. Check build logs in Vercel Dashboard
4. Try building locally: `pnpm run build`

## 📚 Additional Resources

- [Vercel Next.js Deployment Guide](https://vercel.com/docs/frameworks/nextjs)
- [Firebase Auth Custom Domains](https://firebase.google.com/docs/auth/custom-authdomain)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules)

## ✨ Migration Complete Checklist

- [x] Firebase Auth proxy routes configured
- [x] Middleware fixed to skip `__` paths
- [x] Rate limiting migrated to Firestore
- [x] Documentation updated
- [ ] Environment variables added to Vercel
- [ ] Firebase Console authorized domains updated
- [ ] Cloud Functions CORS updated
- [ ] Deployed to Vercel
- [ ] Domains configured in Vercel
- [ ] Firebase Functions deployed
- [ ] Firestore/Storage rules deployed
- [ ] All features tested
- [ ] Production monitoring set up

---

**Need Help?**

- Check `docs/VERCEL_MIGRATION.md` for detailed Firebase Auth setup
- Review Firebase Console logs for specific errors
- Check Vercel logs for deployment issues
