# CI policy: fast development, deliberate releases

CartShift is in active development. Routine pull requests and pushes to `main` should provide useful feedback without running the entire production validation pipeline.

## Automatic checks: GitHub Actions → CI / quality

For each pull request and push to `main` (except documentation-only changes):

- Install dependencies with pnpm cache and skip the Puppeteer browser download.
- Generate translations.
- Lint changed JS/TS source files. A change to shared tooling (`package.json`, `pnpm-lock.yaml`, `eslint.config.mjs`, or `tsconfig.json`) triggers whole-repository ESLint.
- Run Vitest tests affected by the diff against the PR base / previous push revision. Vitest expands to all tests for key configuration changes; when the base commit is unavailable, the workflow runs the full test suite.
- Older CI runs for the same branch/PR are canceled.

**Not automatic:** whole-project TypeScript validation, the entire Vitest suite, and the Next.js production build. These remain available before deployment/release, but do not slow down every iteration. Tests detected as related use static imports; indirect/dynamic dependencies might not be detected.

The `CI / quality` job name is intentionally unchanged to avoid breaking existing required-check references. Any additional GitHub branch protection settings still need review in repository settings if merges remain blocked.

## Full validation: manual

1. In GitHub, open **Actions → CI → Run workflow**.
2. Select the branch you plan to release and run it.
3. The **full** job executes `pnpm lint` (ESLint + TypeScript), `pnpm test:run`, and `pnpm build`.

Run the full workflow before a production release or a major architecture change, and whenever a fast check misses an integration failure.

## Firestore security rules

`Firestore Rules QA` remains a separate, automatic workflow for changes to `firestore.rules`, its tests, or its own workflow. It was not loosened: rules changes should still exercise tenant-isolation checks.

## Caveats

- This setup favors developer velocity over guaranteed pre-merge production readiness. A passing fast check does **not** mean a full build will pass.
- GitHub Actions reports the check outcome, but repository branch-protection rules and Vercel deployment gates are configured separately.
- Avoid adding expensive checks back to the automatic `quality` job without a clear reason; use the manual `full` job for release confidence.
