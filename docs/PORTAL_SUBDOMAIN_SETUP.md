# Portal Subdomain Setup Guide

This guide explains how `portal.cart-shift.com` subdomain routing works in CartShift Studio.

## Overview

The portal can be accessed via two URLs:

- **Main Domain**: `cart-shift.com/portal/...` (legacy/fallback)
- **Subdomain**: `portal.cart-shift.com/...` (preferred)

## Architecture

### Production (Firebase App Hosting)

With Firebase App Hosting running Next.js in standalone mode:

1. **Server-side routing** handles all URL patterns dynamically
2. **Next.js middleware** can run in production for subdomain detection
3. **Dynamic routes** work without pre-configuration

### Development

- **Next.js middleware** (`middleware.ts`) handles subdomain simulation
- Localhost doesn't support subdomains, so all routes use `/portal/...` prefix

### File Structure

```
middleware.ts                    # Subdomain routing (works in dev + production)
components/providers/
│   └── PortalSubdomainRedirect.tsx  # Cleans /portal/ prefix on subdomain
lib/
├── utils/
│   ├── subdomain.ts            # Client-side subdomain detection
│   └── portal-paths.ts         # URL generation utilities
├── hooks/
│   ├── useSubdomain.ts         # React hook for subdomain state
│   └── usePortalNavigation.ts  # Subdomain-aware navigation hook
```

## How It Works

### Server-Side Routing

With App Hosting, Next.js handles routing at runtime:

- `portal.cart-shift.com/en/dashboard/` → serves portal dashboard
- `cart-shift.com/en/portal/dashboard/` → serves same content

### Client-Side URL Generation

The `getPortalPath()` utility is subdomain-aware and automatically generates the correct URLs:

```tsx
import { getPortalPath } from '@/lib/utils/portal-paths';

// On main domain (cart-shift.com):
getPortalPath('/dashboard/'); // → 'https://portal.cart-shift.com/en/dashboard/'

// On portal subdomain (portal.cart-shift.com):
getPortalPath('/dashboard/'); // → '/dashboard/'

// In development (localhost):
getPortalPath('/dashboard/'); // → '/portal/dashboard/'
```

**Key behaviors:**
- **Main domain → Subdomain redirect**: When users click portal links on `cart-shift.com`, they are directed to `portal.cart-shift.com`
- **Internal navigation**: Within the portal subdomain, links stay relative for seamless navigation
- **Development**: Uses `/portal/...` paths for local Next.js routing

For full subdomain URLs (e.g., for emails or sharing):
```tsx
import { getPortalSubdomainUrl } from '@/lib/utils/portal-paths';

getPortalSubdomainUrl('/requests/', 'en'); // → 'https://portal.cart-shift.com/en/requests/'
```

## Setup Steps

### 1. DNS Configuration

```
Type: CNAME
Name: portal
Value: cart-shift.com
TTL: 3600
```

### 2. Firebase App Hosting

1. Firebase Console → App Hosting → Settings
2. Add custom domain `portal.cart-shift.com`
3. Complete verification steps
4. Wait for SSL provisioning

### 3. Firebase Authentication

Add `portal.cart-shift.com` to authorized domains:

- Firebase Console → Authentication → Settings → Authorized domains

### 4. Google OAuth

Add redirect URIs:

- `https://portal.cart-shift.com/en/oauth-callback/`
- `https://portal.cart-shift.com/he/oauth-callback/`

## Usage Guide

### Navigation in Components

```tsx
import { usePortalNavigation } from '@/lib/hooks/usePortalNavigation';

function MyComponent() {
  const { navigateToPortal, getPortalHref } = usePortalNavigation();

  return <Link href={getPortalHref('/requests/')}>View Requests</Link>;
}
```

### UI Context

```tsx
import { usePortalSubdomainUI } from '@/components/portal/SubdomainHandler';

function Header() {
  const { isPortalSubdomain, showFullBranding } = usePortalSubdomainUI();
  return showFullBranding ? <Logo /> : <MiniLogo />;
}
```

## URL Mapping

| Main Domain                           | Subdomain                             |
| ------------------------------------- | ------------------------------------- |
| `cart-shift.com/en/portal/dashboard/` | `portal.cart-shift.com/en/dashboard/` |
| `cart-shift.com/en/portal/requests/`  | `portal.cart-shift.com/en/requests/`  |
| `cart-shift.com/en/portal/login/`     | `portal.cart-shift.com/en/login/`     |

## Troubleshooting

| Issue               | Solution                                         |
| ------------------- | ------------------------------------------------ |
| CORS errors         | Check CORS config in `functions/index.js`        |
| Auth issues         | Verify authorized domains in Firebase Console    |
| SSL not working     | Wait 48 hours for provisioning                   |
| 404 on routes       | Check route params and dynamic segments          |
| Wrong URLs in links | Use `getPortalPath()` instead of hardcoded paths |
