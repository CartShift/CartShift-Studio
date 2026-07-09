# ESLint Configuration

## Current Setup

This project uses **ESLint flat config format** (`eslint.config.mjs`) with Next.js 16.

## Linting Commands

### Primary Linting (Recommended)

```bash
npm run lint          # Run ESLint + TypeScript type checking (default tsc / TS 6)
npm run lint:fix      # Run ESLint with auto-fix + TypeScript type checking
npm run typecheck     # TypeScript 7 checks only (no ESLint)
```

### Next.js Built-in Linting (Known Issue)

```bash
npm run lint:next     # Uses `next lint` (currently has compatibility issues)
```

## Known Issue: `next lint` Command

**Problem:** The `next lint` command fails with the error:

```
Invalid project directory provided, no such directory: .../lint
```

**Root Cause:** Next.js 16's `next lint` command has a bug when using ESLint flat config format (`eslint.config.mjs`). It incorrectly interprets "lint" as a directory argument.

**Solution:** We use direct ESLint commands instead:

- `eslint . --ext .ts,.tsx,.js,.jsx` - Runs ESLint directly
- `tsc --noEmit` - Runs TypeScript type checking

This approach:

- ✅ Works correctly with flat config
- ✅ Matches the same checks as `next build` (which includes TypeScript checking)
- ✅ Catches all linting and type errors before deployment

## Configuration Files

- **`eslint.config.mjs`** - ESLint flat config with Next.js, React, and TypeScript rules
- **`tsconfig.json`** - TypeScript configuration
- **`next.config.mjs`** - Next.js config (includes `eslint.ignoreDuringBuilds: false`)

## What Gets Linted

- All `.ts`, `.tsx`, `.js`, `.jsx` files in the project
- Excludes: `node_modules`, `.next`, `build_out`, `functions`, `docs`, config files, scripts

## Type Checking

TypeScript type checking is included in the lint script (`tsc --noEmit`, default TypeScript 6 package) to match what `next build` does during deployment.

For **TypeScript 7** checks without running ESLint, use:

```bash
npm run typecheck
```

This invokes `typescript-7` (`typescript@7.0.2`) via `node ./node_modules/typescript-7/bin/tsc --noEmit`. On Windows ARM64, the native binary package `@typescript/typescript-win32-arm64` must be installed (already listed in `devDependencies`).

This ensures:

- Type errors are caught before deployment
- Linting and type checking are consistent
- TS 7 can be validated independently of the full lint pass
- No surprises during CI/CD builds

## Custom ESLint Plugins

### RTL Logical Properties (`rtl/enforce-logical-properties`)

Enforces logical CSS properties (ms-, me-, ps-, pe-, start-, end-) instead of physical ones (ml-, mr-, pl-, pr-, left-, right-) for better RTL support.

### Portal Translations (`portal-translations/enforce-portal-translations`)

Enforces standardized translation pattern for portal files:

- Must use `useTranslations('portal')` in portal files
- Must NOT use `'portal.'` prefix when using namespaced hook
- Auto-fixable violations

See [ESLint Translation Rule](./ESLINT_TRANSLATION_RULE.md) for detailed documentation.

## Future Fix

When Next.js fixes the `next lint` compatibility issue with flat config, we can switch back to using `next lint` for better integration with Next.js tooling.
