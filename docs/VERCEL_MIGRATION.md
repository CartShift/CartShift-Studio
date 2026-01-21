# Vercel Migration Guide for Firebase Auth

## Problem: Firebase Auth Handler 404 on Vercel

When migrating from Firebase App Hosting to Vercel, Firebase Auth's internal endpoints (`__/auth/handler`, `__/auth/iframe`) return 404 errors because they only exist on Firebase Hosting.

## Solution: Proxy Routes

This project includes Next.js API routes that proxy Firebase Auth requests to the original Firebase Hosting domain:

- `/app/__auth/handler/route.ts` - Proxies `__/auth/handler` requests
- `/app/__auth/iframe/route.ts` - Proxies `__/auth/iframe` requests

### How It Works

Firebase Auth is configured with a custom authDomain (`cart-shift.com` instead of `cartshiftstudio.firebaseapp.com`). When Firebase Auth tries to access `/__/auth/handler` on your custom domain, the proxy routes forward those requests to `https://cartshiftstudio.firebaseapp.com`.

### Important Fixes Applied

#### 1. Middleware Configuration (`middleware.ts`)

**Problem:** Middleware was processing `__` paths through internationalization middleware, which would break Firebase Auth.

**Fix:** Skip `__` paths completely in middleware:

```typescript
// 1. Skip internal paths completely
if (
  pathname.startsWith('/api') ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/_vercel') ||
  pathname.startsWith('/__')
) {
  return NextResponse.next(); // Changed from intlMiddleware(request)
}
```

#### 2. Iframe Route Headers (`app/__auth/iframe/route.ts`)

**Problem:** `X-Frame-Options: SAMEORIGIN` header prevents Firebase Auth iframe from loading on different domains.

**Fix:** Removed the header to allow cross-origin iframe loading:

```typescript
// Removed: 'X-Frame-Options': 'SAMEORIGIN'
```

#### 3. Vercel Configuration (`vercel.json`)

**Created:** New `vercel.json` to ensure proper routing for Firebase Auth endpoints:

```json
{
  "rewrites": [
    {
      "source": "/__/auth/handler",
      "destination": "/__/auth/handler"
    },
    {
      "source": "/__/auth/iframe",
      "destination": "/__/auth/iframe"
    }
  ]
}
```

## Environment Variables Required

Add these to your Vercel project settings:

### Public Variables (Client-side)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - **Must be `cart-shift.com` (not firebaseapp.com)**
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - `cartshiftstudio`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_SITE_URL` - Your Vercel deployment URL

### Private Variables (Server-side only - NOT NEXT*PUBLIC*)

- `RESEND_API_KEY` - For Firebase Cloud Functions
- `CONTACT_EMAIL` - For email sending
- `RECAPTCHA_SECRET_KEY` - For reCAPTCHA verification

## Firebase Console Configuration

### Authorized Domains

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domains:
   - `cart-shift.com`
   - `www.cart-shift.com`
   - `portal.cart-shift.com`
   - `*.vercel.app` (for preview deployments)

### Firebase Hosting Configuration

Your Firebase project must still have Hosting enabled (even if you deploy the app to Vercel) because:

- Firebase Auth uses internal endpoints on Firebase Hosting
- These endpoints cannot be migrated to Vercel
- The proxy routes forward requests to Firebase Hosting

Keep `firebase.json` minimal (no hosting section needed):

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

## Testing Firebase Auth on Vercel

After deployment, test the following:

1. **Email/Password Sign In**
   - Navigate to portal login page
   - Enter email and password
   - Should authenticate successfully

2. **Google Sign In**
   - Click "Sign in with Google"
   - Popup should open and authenticate
   - Should redirect back to portal

3. **Password Reset**
   - Click "Forgot password"
   - Enter email
   - Should receive reset email

4. **Auth Persistence**
   - Sign in
   - Refresh page
   - Should remain signed in

## Troubleshooting

### 404 on /\_\_/auth/handler

**Cause:** Middleware is processing `__` paths incorrectly.

**Solution:** Ensure middleware returns `NextResponse.next()` for `__` paths (see fix above).

### Firebase Auth Popup Not Working

**Cause:** iframe route has restrictive headers blocking cross-origin access.

**Solution:** Remove `X-Frame-Options` header from iframe route.

### Auth Redirects to Wrong Domain

**Cause:** `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` is set to firebaseapp.com instead of custom domain.

**Solution:** Update environment variable to your custom domain.

### CORS Errors

**Cause:** Firebase Console doesn't have Vercel domain in authorized origins.

**Solution:** Add your Vercel domain to Firebase Console → Authentication → Settings.

## Alternative Approach: Use Firebase Hosting with Custom Domain

If proxy routes cause issues, you can:

1. Keep Next.js on Vercel
2. Set up Firebase Hosting with custom domain for Firebase Auth only
3. Configure Firebase Auth to use a subdomain for auth (e.g., `auth.cart-shift.com`)

This is more complex but provides a more direct connection between Firebase Auth and Firebase Hosting.

## Summary

The Firebase Auth proxy routes allow your Vercel-deployed Next.js app to use Firebase Authentication with a custom authDomain. The key fixes are:

1. ✅ Middleware skips `__` paths completely
2. ✅ Iframe route allows cross-origin access
3. ✅ Vercel configuration ensures proper routing
4. ✅ Firebase Console has authorized domains configured
5. ✅ Environment variables are correctly set

With these changes, Firebase Auth should work seamlessly on Vercel while your app is deployed there.
