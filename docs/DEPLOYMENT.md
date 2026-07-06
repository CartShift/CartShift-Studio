# Deployment Guide

## Vercel Deployment

This project is configured for deployment on [Vercel](https://vercel.com). A `vercel.json` file is included in the root to ensure best practices and security headers are applied.

### Environment Variables

The application requires specific environment variables to function correctly. When deploying to Vercel, you must add these variables in the **Project Settings > Environment Variables** section.

#### Required Variables

These variables **MUST** be set for the build to succeed and the application to run.

| Variable                            | Description                         |
| ----------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`      | Firebase API Key                    |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  | Firebase Auth Domain                |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`   | Firebase Project ID                 |
| `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` | URL of the Firebase Cloud Functions |
| `NEXT_PUBLIC_FIREBASE_APP_ID`       | Firebase App ID                     |

#### Optional but Recommended

| Variable                                   | Description                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                     | The production URL of your site (e.g. `https://cartshift-studio.vercel.app`). Important for SEO and Metadata. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket                                                                                       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID                                                                                  |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`             | Google Client ID (for Auth)                                                                                   |
| `NEXT_PUBLIC_GA_ID`                        | Google Analytics ID                                                                                           |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`              | WhatsApp Number for contact links                                                                             |
| `GOOGLE_SITE_VERIFICATION`                 | Google Site Verification Code                                                                                 |

### Build Settings (Vercel)

The `vercel.json` and `package.json` are configured to handle the build automatically.

- **Framework Preset**: Next.js
- **Build Command**: `pnpm run build`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next` (Default)

### Node.js Version

The project requires **Node.js 24.x** (see `package.json` `engines` and `.nvmrc`). Configure Vercel to use Node 24.

### Troubleshooting

- If the build fails with "Missing required environment variables", ensuring the variables listed above are added to Vercel.
- The `scripts/validate-env.mjs` script runs before build to prevent broken deployments.
