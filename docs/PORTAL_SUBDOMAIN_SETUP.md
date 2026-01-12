# Portal Subdomain Setup Guide

This guide explains how to configure `portal.cart-shift.com` as a subdomain for the CartShift Studio portal.

## Overview

The portal can be accessed via two URLs:
- **Main Domain**: `cart-shift.com/portal/...` (legacy/fallback)
- **Subdomain**: `portal.cart-shift.com/...` (preferred)

Both URLs serve the same content, with client-side logic handling the routing differences.

## Architecture

### File Structure

```
lib/
├── utils/
│   ├── subdomain.ts       # Core subdomain detection utilities
│   └── portal-paths.ts    # Portal path configuration and URL generation
├── hooks/
│   ├── useSubdomain.ts    # React hook for subdomain state
│   └── usePortalNavigation.ts  # Subdomain-aware navigation hook
components/
├── providers/
│   └── PortalSubdomainRedirect.tsx  # Root-level redirect handler
├── portal/
│   └── SubdomainHandler.tsx         # Portal-level route handler
```

### Key Components

1. **`PortalSubdomainRedirect`** (root layout)
   - Redirects users on portal subdomain from non-portal pages to dashboard
   - Strips legacy `/portal/` prefix on subdomain

2. **`SubdomainHandler`** (portal layout)
   - Handles legacy path stripping within portal pages
   - Prevents flash of wrong content

3. **`usePortalNavigation`** hook
   - Provides subdomain-aware navigation functions
   - Automatically adjusts URLs based on current domain

## Setup Steps

### 1. DNS Configuration

Add a CNAME record for the portal subdomain pointing to Firebase Hosting:

```
Type: CNAME
Name: portal
Value: cart-shift.com (or your Firebase Hosting domain)
TTL: 3600 (or default)
```

### 2. Firebase Hosting Custom Domain

1. Go to [Firebase Console](https://console.firebase.google.com) → Hosting
2. Click **"Add custom domain"**
3. Enter `portal.cart-shift.com`
4. Follow the verification steps (may require TXT record)
5. Wait for SSL certificate provisioning (usually 24-48 hours)

### 3. Firebase Authentication

Add `portal.cart-shift.com` as an authorized domain:

1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, click **Add domain**
3. Enter `portal.cart-shift.com`
4. Save changes

### 4. Google OAuth (if using Google Sign-In)

Update Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add these to **Authorized redirect URIs**:
   - `https://portal.cart-shift.com/en/oauth-callback/`
   - `https://portal.cart-shift.com/he/oauth-callback/`
4. Save changes

### 5. Environment Variables

The following environment variables are configured:

```env
NEXT_PUBLIC_SITE_URL=https://cart-shift.com
NEXT_PUBLIC_PORTAL_URL=https://portal.cart-shift.com
```

### 6. CORS Configuration

The Firebase Functions are already configured to accept requests from:
- `https://cart-shift.com`
- `https://www.cart-shift.com`
- `https://portal.cart-shift.com`
- `http://localhost:3000` (development)

## Usage Guide

### Navigation in Components

**Use the `usePortalNavigation` hook for subdomain-aware navigation:**

```tsx
import { usePortalNavigation } from '@/lib/hooks/usePortalNavigation';

function MyComponent() {
  const { navigateToPortal, getPortalHref, navigateToLogin } = usePortalNavigation();

  // Navigate programmatically
  const handleClick = () => {
    navigateToPortal('/dashboard/');
  };

  // For Link components
  return (
    <Link href={getPortalHref('/requests/')}>
      View Requests
    </Link>
  );
}
```

### Path Generation

**Use `getPortalPath` for generating correct URLs:**

```tsx
import { getPortalPath } from '@/lib/utils/portal-paths';

// On main domain (cart-shift.com):
getPortalPath('/dashboard/') // => '/en/portal/dashboard/'

// On portal subdomain (portal.cart-shift.com):
getPortalPath('/dashboard/') // => '/en/dashboard/'
```

### Checking Subdomain Context

```tsx
import { usePortalSubdomainUI } from '@/components/portal/SubdomainHandler';

function Header() {
  const { isPortalSubdomain, showFullBranding } = usePortalSubdomainUI();

  return (
    <header>
      {showFullBranding && <Logo />}
      {/* ... */}
    </header>
  );
}
```

## URL Mapping

| Main Domain URL | Subdomain URL |
|----------------|---------------|
| `cart-shift.com/en/portal/` | `portal.cart-shift.com/en/dashboard/` |
| `cart-shift.com/en/portal/dashboard/` | `portal.cart-shift.com/en/dashboard/` |
| `cart-shift.com/en/portal/requests/` | `portal.cart-shift.com/en/requests/` |
| `cart-shift.com/en/portal/login/` | `portal.cart-shift.com/en/login/` |

## Best Practices

### 1. Always Use Navigation Hooks
Never hardcode `/portal/` paths in components. Use `usePortalNavigation` or `getPortalPath` instead.

### 2. Handle Loading States
The subdomain handlers may cause brief delays. Ensure your components show appropriate loading states.

### 3. Test Both Domains
Always test your changes on both `cart-shift.com/portal/` and `portal.cart-shift.com/`.

### 4. Use `window.location.replace()` for Redirects
This creates cleaner browser history by replacing the current entry instead of adding a new one.

## Testing

### Local Development

In development (`localhost`), the subdomain detection is disabled, and all portal routes work normally at `/portal/...`.

### Production Testing

1. Deploy to Firebase Hosting
2. Wait for domain setup to complete
3. Visit `portal.cart-shift.com` - should redirect to dashboard (if logged in) or login
4. Verify all portal pages load correctly
5. Test navigation between pages
6. Test authentication flows

## Troubleshooting

### "Origin not allowed" errors
- Verify CORS configuration in `functions/index.js`
- Redeploy Firebase Functions after changes

### Authentication issues
- Check Firebase Console → Authentication → Authorized domains
- Verify Google OAuth redirect URIs

### SSL certificate not working
- Firebase SSL provisioning can take up to 48 hours
- Ensure DNS is correctly configured

### Pages not loading on subdomain
- Check browser console for errors
- Verify Firebase Hosting rewrites include subdomain paths
- Check that `PortalSubdomainRedirect` is in the root layout

### Navigation not working correctly
- Ensure you're using `usePortalNavigation` hook
- Check that `getPortalPath` is being called with correct paths
- Verify paths don't have duplicate `/portal/` prefixes
