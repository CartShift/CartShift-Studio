# CartShift SEO Technical Monitor Automation

This automation reviews Google Search Console, GA4, and the local SEO/content inventory, then records professional SEO findings, applies safe repo fixes, validates them, and deploys only when the release path is clean.

## Purpose

Use this monitor for recurring SEO operations:

- detect pages with impressions but weak CTR,
- find queries in ranking positions 4-20,
- surface ranking and traffic declines,
- flag query/page cannibalization,
- inspect GSC submitted sitemap health,
- inspect high-risk URLs through the Search Console URL Inspection API,
- expose indexability, robots, canonical, page-fetch, and sitemap-membership problems,
- compare Search Console visibility with GA4 organic landing-page behavior,
- inspect blog frontmatter, Hebrew support, body depth, and internal-link coverage,
- record every run in `docs/SEO_MONITOR_DECISION_LOG.md`,
- write timestamped reports to `docs/seo-monitor-reports/`.

## Commands

```bash
pnpm seo:monitor
pnpm seo:monitor:json
pnpm seo:monitor:apply
```

`pnpm seo:monitor` is the default recurring mode. It generates a report and decision-log entry without editing content.

`pnpm seo:monitor:apply` uses the Google APIs as evidence sources, not as fix mechanisms. It exposes the problems in the report, maps them to repo-owned fixes, edits only clean deterministic targets, validates, commits, and pushes to `origin/main` when validation succeeds.

## Required Environment

Use the same Google auth variables as the article publisher:

- `GOOGLE_APPLICATION_CREDENTIALS`, either as a path to service-account JSON or the full JSON value
- Or `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL`
- `GA4_PROPERTY_ID` or `GOOGLE_ANALYTICS_PROPERTY_ID`

For this project, prefer:

```bash
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:cart-shift.com
```

The monitor intentionally does not print secret values.

## API-to-Repo Fix Loop

The monitor is intentionally conservative, but apply mode is expected to fix safe issues end to end:

1. Pull evidence from Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, and the local repo inventory.
2. Expose the exact problem in the Markdown and JSON report.
3. Build a repo fix plan with a clear `safeToApply` decision.
4. Apply only deterministic repo changes where the target file is clean.
5. Run validation.
6. Stage only automation-owned files.
7. Commit and push to `origin/main`; Vercel deploys from main.

Automatic content/code edits are allowed only when all of these are true:

- the finding is backed by GSC or GA4 evidence,
- the target file is clean in Git,
- the fix is narrow and reversible,
- validation passes,
- only automation-owned files are staged.

Good auto-fix candidates:

- localized canonical/internal-link consolidation, such as `/blog/*` links that should render as `/{locale}/blog/*`,
- internal-link additions between clearly related blog/service pages,
- frontmatter title/excerpt improvements for one clean Markdown file,
- stale CTA updates,
- sitemap/metadata issues with deterministic fixes.

Unsafe auto-fixes:

- rewriting core service positioning from weak data,
- publishing new articles for tiny query samples without editorial review,
- changing generated translation files directly,
- editing dirty user files,
- committing when `pnpm build` fails or times out.

## Recommended Schedule

Run three times per week:

- Monday: diagnostic report only
- Wednesday: diagnostic report plus safe fix queue
- Friday: deeper review before publishing/content automation

## Output

Each run creates:

- a Markdown report under `docs/seo-monitor-reports/`,
- a JSON data snapshot next to the report,
- a decision-log entry in `docs/SEO_MONITOR_DECISION_LOG.md`.

## Deployment Policy

Report-only mode does not deploy. Apply mode deploys only when it actually edits a safe repo target and validation passes:

1. inspect Git status first,
2. avoid unrelated dirty files,
3. run `pnpm build`,
4. stage only automation-owned changes,
5. commit with a clear SEO automation message,
6. push to `origin/main` only when validation succeeds.
