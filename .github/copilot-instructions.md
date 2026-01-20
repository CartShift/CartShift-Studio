# GitHub Copilot Instructions for CartShift Studio

## ⚠️ Translation Files - CRITICAL RULE

### NEVER EDIT GENERATED FILES

**DO NOT EDIT** these files directly:

- `messages/en.json`
- `messages/he.json`

These files are **auto-generated** and will be overwritten. They contain a `_meta._generated: true` field at the top.

### ALWAYS EDIT SOURCE FILES

Edit translation source files in `messages/src/{locale}/`:

- `messages/src/en/common.json`
- `messages/src/en/portal.json`
- `messages/src/en/website.json`
- `messages/src/en/legal.json`
- `messages/src/he/common.json`
- `messages/src/he/portal.json`
- `messages/src/he/website.json`
- `messages/src/he/legal.json`

### Workflow

1. **Edit** source files in `messages/src/{locale}/`
2. **Run** `npm run i18n:merge` to regenerate the output files
3. Generated files are automatically updated on `prebuild` and `predev`

### How to Identify Generated Files

- Look for `_meta._generated: true` at the top of JSON files
- Generated files have `_meta._warning` field with instructions
- See `messages/README.md` for complete documentation

## Code Guidelines

- **Framework**: Next.js 16+ (App Router, Server Components)
- **State Management**: TanStack Query (v5) for server state
- **Styling**: Tailwind CSS + CVA (class-variance-authority)
- **Internationalization**: next-intl (supports LTR and RTL)
- **Animations**: Framer Motion (layoutId transitions)
- **Database**: Firebase (Firestore, Auth, Storage)

### Translation Key Pattern

When adding new translations:

1. Add to appropriate source file in `messages/src/{locale}/`
2. Use dot notation: `portal.quickActions.newRequest`
3. Run merge script: `npm run i18n:merge`
4. Use in code: `t('portal.quickActions.newRequest')`

## File Organization

- `app/` - Next.js pages and routes
- `components/` - React components
- `lib/hooks/` - Custom React hooks (use for Firestore)
- `lib/services/` - Service layer
- `messages/src/` - **Translation source files (EDIT HERE)**
- `messages/*.json` - **Generated files (DO NOT EDIT)**
