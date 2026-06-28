# CartShift Studio

A modern, high-performance, and conversion-optimized ecosystem for CartShift Studio. This project includes a public website and a comprehensive agency/client portal built with Next.js 16+, Firebase, and TanStack Query.

## Project Vision

CartShift Studio provides a seamless experience for both agency administrators and clients, managing consultations, service requests, workboards, and billing through a unified, avant-garde interface.

## Getting Started

### Prerequisites

- Node.js 24.x (see `.nvmrc`)
- pnpm
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Install Firebase Functions dependencies:

```bash
cd functions
pnpm install
cd ..
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase and API configuration values.

4. Run the fast web development server with the debounced translation watcher:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Use `pnpm dev:full` when Firebase Functions are also needed, `pnpm dev:functions`
for the Functions emulator alone, and `pnpm clean:cache` when Turbopack reports
a stale or corrupted cache (or after dependency changes on Windows ARM64).

## Project Architecture

- `app/[locale]/` - Next.js App Router with i18n support.
  - `(website)` - Public pages (Hero, Services, Blog, Portfolio).
  - `portal/` - The core application.
    - `agency/` - Management interface for agency staff (Workboards, Client management, Consultations).
    - `org/[orgId]/` - Client-specific dashboards and request management.
- `components/` - Organized for scale:
  - `portal/` - Application-specific UI components, forms, and providers.
  - `sections/` - Content sections for the public website.
  - `ui/` - Shared design system primitives (CVA-powered).
- `lib/` - Shared logic:
  - `services/` - Firebase/Firestore service layer.
  - `hooks/` - Custom React hooks (TanStack Query integrations).
  - `utils/` - Formatting, validation, and styling helpers.
- `functions/` - Firebase Cloud Functions (Backend logic, Emails, Integrations).
- `messages/` - Localization files for `next-intl`.
  - `messages/src/` - **Source translation files (EDIT THESE)**
  - `messages/*.json` - **Generated files (DO NOT EDIT - see messages/README.md)**

## Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Data Fetching**: [@tanstack/react-query](https://tanstack.com/query/latest) (Server state management)
- **Backend/Auth**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage, Hosting, Functions)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [class-variance-authority (CVA)](https://cva.style/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Layout transitions, micro-interactions)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **UI Components**: [Sonner](https://sonner.stevenlyui.com/) (Toasts), [Lucide React](https://lucide.dev/) (Icons)

## Key Features & Coding Standards

- **Atomic Design System**: Components are built using CVA for consistent variants and themes.
- **RTL Support**: All layout and spacing use logical CSS properties (`ms-*`, `pe-*`, `ps-*`, `start-*`, `end-*`) to support both LTR and RTL directions.
- **Server State Hook Pattern**: Data operations are encapsulated in custom TanStack Query hooks (e.g., `useRequestMutation`, `useAgencyClients`) for caching and optimistic updates.
- **Shared Element Transitions**: Morphing effects between views using Framer Motion's `layoutId`.
- **Comprehensive Error Handling**: Centralized Error Boundaries and Toast-based notifications for all async actions.
- **SEO & Performance**: Optimized metadata, fast LCP through Next.js Image/Font optimization, and bundle analysis.

## Deployment

**Current:** Vercel (with Firebase Auth, Firestore, and Cloud Functions)

See [VERCEL_MIGRATION.md](./docs/VERCEL_MIGRATION.md) for detailed Firebase Auth configuration on Vercel.

### Firebase Services

- ✅ **Authentication** - Proxied via Next.js routes to Firebase Hosting
- ✅ **Firestore Database** - Direct client connection
- ✅ **Storage** - Direct client connection
- ✅ **Cloud Functions** - Deployed separately to Firebase

### Quick Deploy

```bash
# Deploy to Vercel
vercel --prod

# Deploy Firebase Cloud Functions
pnpm run deploy:functions

# Deploy Firestore/Storage rules
pnpm run deploy:rules
```

## Translations

⚠️ **Important**: Never edit `messages/en.json` or `messages/he.json` directly. These are auto-generated files.

- Edit source files in `messages/src/{locale}/` (e.g., `messages/src/en/portal.json`)
- Run `npm run i18n:merge` to regenerate output files
- See [messages/README.md](./messages/README.md) for complete documentation

## Store Analyzer

The Store Analyzer is a free tool that provides comprehensive e-commerce store audits.

### Features

- 📊 Performance, SEO, Accessibility, and Best Practices analysis (via Google PageSpeed API)
- 📸 Visual analysis with mobile/desktop screenshots (via Puppeteer)
- 🛒 Product page auditing and cart actionability testing
- 🤖 AI readiness and structured data analysis
- 🎯 Competitor analysis and market positioning
- 📈 Benchmark comparison with industry standards

### Setup & Diagnostics

```bash
# Check if Puppeteer/Chrome is available
pnpm diagnose:puppeteer

# Test the analyzer (requires dev server)
pnpm test:analyzer
```

### Troubleshooting

If the analyzer fails or visual analysis is skipped:

1. Run diagnostics: `pnpm diagnose:puppeteer`
2. See [docs/STORE_ANALYZER_SETUP.md](./docs/STORE_ANALYZER_SETUP.md) for detailed setup
3. See [docs/STORE_ANALYZER_FIX.md](./docs/STORE_ANALYZER_FIX.md) for recent bug fixes

**Note**: The analyzer gracefully degrades if Puppeteer/Chrome is unavailable. Core metrics (Performance, SEO, Accessibility) will still work via the PageSpeed API.

## Documentation

- [messages/README.md](./messages/README.md) - Translation files structure and workflow
- [docs/STORE_ANALYZER_SETUP.md](./docs/STORE_ANALYZER_SETUP.md) - Store Analyzer setup and deployment guide
- [docs/STORE_ANALYZER_FIX.md](./docs/STORE_ANALYZER_FIX.md) - Recent bug fixes and improvements
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Firebase deployment guide
- [TESTING.md](./docs/TESTING.md) - Testing checklist
- [PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md) - Implementation summary
- [CODE_REVIEW.md](./docs/CODE_REVIEW.md) - Documentation of project refinements
- [INCONSISTENCIES_ANALYSIS.md](./docs/INCONSISTENCIES_ANALYSIS.md) - Design system alignment

## License

Private project - CartShift Studio © 2026
