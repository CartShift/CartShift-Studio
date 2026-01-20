# Firebase App Hosting Deployment Status

## ✅ Current Configuration

- **Hosting**: Firebase App Hosting (Cloud Run)
- **Mode**: Next.js standalone (server-side rendering)
- **Project ID**: cartshiftstudio
- **Config File**: `apphosting.yaml`

## ✅ Completed Setup

1. **Firebase App Hosting**: Connected to repository
2. **Firestore**: Enabled with rules in `firestore.rules`
3. **Storage**: Enabled with rules in `storage.rules`
4. **Cloud Functions**: Deployed (requires Blaze plan)
5. **Environment Variables**: Configured in `apphosting.yaml`

## 📋 Deployment

Firebase App Hosting deploys automatically on push to the connected branch.

### Manual Deployments

**Deploy rules only**:

```bash
pnpm run deploy:rules
```

**Deploy functions**:

```bash
pnpm run deploy:functions
```

## 🔧 Configuration Files

| File              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `apphosting.yaml` | App Hosting config (Cloud Run settings, env vars) |
| `firebase.json`   | Firestore/Storage rules, Functions config         |
| `firestore.rules` | Firestore security rules                          |
| `storage.rules`   | Storage security rules                            |

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/project/cartshiftstudio/overview
- App Hosting: https://console.firebase.google.com/project/cartshiftstudio/apphosting
- Firestore: https://console.firebase.google.com/project/cartshiftstudio/firestore
- Functions: https://console.firebase.google.com/project/cartshiftstudio/functions

## 📝 Notes

- Dynamic routes (requests, pricing, clients, invites) work at runtime - no static generation needed
- Environment variables are managed in `apphosting.yaml` with Firebase Secrets
- Contact form submissions stored in Firestore: `contact_submissions`
