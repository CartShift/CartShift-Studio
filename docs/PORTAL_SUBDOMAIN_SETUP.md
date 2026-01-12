# Portal Subdomain Setup Guide

This guide explains how `portal.cart-shift.com` subdomain routing works in CartShift Studio.

## Overview

The portal can be accessed via two URLs:

- **Main Domain**: `cart-shift.com/portal/...` (legacy/fallback)
- **Subdomain**: `portal.cart-shift.com/...` (preferred)

## Architecture

### Production (Static Export + Firebase Hosting)

Since the app uses `output: 'export'` for production, **middleware doesn't run**. Instead:

1. **Firebase Hosting rewrites** (`firebase.json`) handle all URL routing
2. Requests to `portal.cart-shift.com/en/dashboard/` are served from `/en/portal/dashboard/index.html`
3. **Client-side utilities** generate correct URLs based on detected subdomain

### Development

- **Next.js middleware** (`middleware.ts`) handles subdomain simulation
- Localhost doesn't support subdomains, so all routes use `/portal/...` prefix

### File Structure

```
middleware.ts                    # Dev-only subdomain routing
firebase.json                    # Production rewrites (Firebase Hosting)
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

### Why Client-Side Redirect is Needed

Since static export can't detect subdomains during build, links are generated with `/portal/` prefix. When users click these links on `portal.cart-shift.com`, `PortalSubdomainRedirect` strips the prefix for clean URLs.

## How It Works

### Firebase Hosting Rewrites

The `firebase.json` already maps clean paths to portal pages:

```json
{ "source": "/en/dashboard/**", "destination": "/en/portal/dashboard/index.html" },
{ "source": "/en/requests/**", "destination": "/en/portal/requests/index.html" },
// ... etc
```

When deployed, both domains serve from the same Firebase Hosting site. The rewrites ensure:

- `portal.cart-shift.com/en/dashboard/` → serves `/en/portal/dashboard/index.html`
- `cart-shift.com/en/portal/dashboard/` → serves same content

### Client-Side URL Generation

The utilities detect subdomain and generate correct URLs:

```tsx
import { getPortalPath } from '@/lib/utils/portal-paths';

// On main domain: '/portal/dashboard/'
// On subdomain: '/dashboard/'
getPortalPath('/dashboard/');
```

## Setup Steps

### 1. DNS Configuration

```
Type: CNAME
Name: portal
Value: cart-shift.com
TTL: 3600
```

### 2. Firebase Hosting

1. Firebase Console → Hosting → Add custom domain
2. Enter `portal.cart-shift.com`
3. Complete verification steps
4. Wait for SSL provisioning (24-48 hours)

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

## Important Notes

### Static Export Limitations

Since production uses `output: 'export'`:

- **No server-side redirects** - All routing is handled by Firebase Hosting
- **No middleware in production** - `middleware.ts` is dev-only
- **Client-side detection** - Subdomain detection happens in browser

### Adding New Portal Pages

When adding new portal pages, update `firebase.json` rewrites:

```json
{
  "source": "/en/new-page/**",
  "destination": "/en/portal/new-page/index.html"
},
{
  "source": "/he/new-page/**",
  "destination": "/he/portal/new-page/index.html"
}
```

## Troubleshooting

| Issue               | Solution                                         |
| ------------------- | ------------------------------------------------ |
| CORS errors         | Check CORS config in `functions/index.js`        |
| Auth issues         | Verify authorized domains in Firebase Console    |
| SSL not working     | Wait 48 hours for provisioning                   |
| 404 on subdomain    | Add missing rewrites to `firebase.json`          |
| Wrong URLs in links | Use `getPortalPath()` instead of hardcoded paths |
