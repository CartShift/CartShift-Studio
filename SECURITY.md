# Security Policy

## Supported Versions

Security fixes are applied to the active production deployment on [cart-shift.com](https://cart-shift.com).

| Version | Supported |
| ------- | --------- |
| `main`  | Yes       |

## Reporting a Vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

Email **hello@cart-shift.com** with:

- Description of the issue and potential impact
- Steps to reproduce
- Affected URLs or API routes (if applicable)

We aim to acknowledge reports within **72 hours** and will coordinate disclosure timing with you.

## Security Architecture (Summary)

- **Authentication:** Firebase Auth with HttpOnly session cookies (`__session`) verified server-side via Firebase Admin SDK.
- **Authorization:** Firestore security rules enforce org/agency membership; portal API routes use `requireAgencySession()` or `getServerSession()`.
- **Dev-only routes:** `/api/dev/portal-auth` is disabled unless `NODE_ENV=development`, `PORTAL_DEV_AUTH_ENABLED=true`, and the request originates from localhost.
- **Secrets:** Never commit `.env`, `.env.local`, service account JSON, or API keys. Use Vercel/Firebase environment configuration in production.
- **Public endpoints:** Contact, newsletter, store analyzer, and marketing routes use rate limiting and input validation; reCAPTCHA protects the analyzer.

## Safe Configuration Checklist

Before deploying or making the repository public:

- [ ] All secrets are in environment variables (not in source code)
- [ ] `PORTAL_DEV_AUTH_ENABLED` is `false` in production
- [ ] Firebase Admin credentials (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are set only on the server
- [ ] PayPal webhook ID and secrets match the production PayPal app
- [ ] Firestore and Storage rules are deployed (`pnpm run deploy:rules`)
