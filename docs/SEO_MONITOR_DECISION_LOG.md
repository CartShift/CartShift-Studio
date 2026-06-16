# SEO Monitor Decision Log

This log records Search Console and GA4 SEO monitor runs, findings, fixes, validation, and deployment status.

## Runs

## 2026-05-26 - CartShift SEO Technical Monitor

- Outcome: Manual review documented; no repo behavior change applied.
- Data sources used: Latest available repo-backed monitor report plus focused repo inspection.
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: Latest available report OK; fresh run not reached because `pnpm` was unavailable and direct monitor process execution was denied.
- GSC access: Latest available report OK; fresh run not reached in this sandbox.
- Top evidence: Search Console URL Inspection reported `https://cart-shift.com/en/terms` as `Excluded by noindex tag`, while local route metadata, layout metadata, robots config, and the built `build_out/en/terms/index.html` artifact all indicate `index, follow`.
- Chosen action: Do not make a code change for `/en/terms`; request live URL reinspection/manual deployment verification because the noindex signal does not map to a safe current repo diff.
- Affected files: `docs/SEO_MONITOR_DECISION_LOG.md`
- Validation: Candidate route files were clean; focused static inspection found no route/layout/header noindex source for `/en/terms`; built artifact contains `<meta name="robots" content="index, follow"/>`.
- Deployment: Not attempted; no code fix was staged or committed.
- Notes: Existing dirty/untracked automation files were preserved and left unstaged.

## 2026-05-25 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Google Search Console, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- Top issue: Decline
- Recommended action: Investigate pages with material Search Console or GA4 declines before publishing new content.
- Affected files: `docs/seo-monitor-reports/2026-05-25T22-46-59-784Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-05-26 - CartShift SEO Technical Monitor

- Outcome: Blocked
- Data sources used: Attempted Google Search Console, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: Not reached in this sandboxed run
- GSC access: Not reached in this sandboxed run
- Top issue: Automation runtime/network blocker
- Recommended action: Re-run `pnpm seo:monitor:json` in an environment with `pnpm` and outbound Google API access, then apply only evidence-backed repo fixes.
- Affected files: None for SEO behavior; this decision log entry records the blocked run.
- Validation: `pnpm seo:monitor:json` could not start because `pnpm` was unavailable in the sandbox PATH; the equivalent monitor module was attempted in-process and blocked on `fetch failed`.
- Deployment: Not attempted.
- Notes: No secret values were printed. Existing dirty SEO automation files and the prior `lib/markdown.ts` localization fix were left untouched.

## 2026-05-26 - Follow-up Fix

- Outcome: Fixed narrow technical SEO issue
- Evidence: Search Console showed a cannibalization cluster for `shopify site seo report generator` split across `https://cart-shift.com/blog/shopify-seo-complete-guide` and `https://cart-shift.com/en/blog/shopify-seo-complete-guide` with 36 impressions.
- Action: Localized raw Markdown article links from `/blog/*` to `/{locale}/blog/*` during HTML post-processing so article links no longer feed crawlable default-locale redirect paths.
- Affected files: `lib/markdown.ts`
- Validation: TypeScript transpile check passed; focused link-localization assertions passed. `pnpm seo:monitor:json` could not run directly because `pnpm` was unavailable in the sandbox, so the equivalent monitor module was executed in-process. `pnpm build` was not run because package-manager and child-process execution are blocked in this sandbox.
- Deployment: Not attempted; local validation only.
- Notes: Pre-existing dirty/untracked SEO automation setup files were left unstaged and untouched.

## 2026-05-25 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 13 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-05-25T23-03-28-373Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-06-15 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-06-15T15-24-20-714Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-06-15 - LLM SEO Release Decision

- Outcome: Partially fixed; release blocked by build timeout
- Data sources used: Fresh monitor report `docs/seo-monitor-reports/2026-06-15T15-24-20-714Z-seo-monitor.{md,json}`, live HTML checks, local route/sitemap/robots inspection, repo blog inventory
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- Top evidence: URL Inspection reported `/en/terms` as `Excluded by noindex tag`, `/blog/*` and `/en/blog/*` Shopify SEO URLs as `Crawled - currently not indexed`, no sitemap API errors, and a content-quality issue for `ai-tools-ecommerce-complete-guide-2026` with few internal links.
- Diagnosis: Live `/en/terms` now returns `<meta name="robots" content="index, follow"/>` with a self canonical, live sitemap includes `/en/terms` and the localized blog URLs, and default `/blog/*` URLs 307 redirect to `/en/blog/*`; these technical findings need Search Console reinspection rather than a blind repo change.
- Chosen action: Added one natural internal link in both English and Hebrew bodies of `content/blog/ai-tools-ecommerce-complete-guide-2026.md` to strengthen the Shopify SEO topic cluster while preserving locale-aware Markdown blog-link localization.
- Affected files: `content/blog/ai-tools-ecommerce-complete-guide-2026.md`, `docs/SEO_MONITOR_DECISION_LOG.md`, `docs/seo-monitor-reports/2026-06-15T15-24-20-714Z-seo-monitor.md`, `docs/seo-monitor-reports/2026-06-15T15-24-20-714Z-seo-monitor.json`
- Validation: `pnpm exec prettier --check content/blog/ai-tools-ecommerce-complete-guide-2026.md docs/SEO_MONITOR_DECISION_LOG.md docs/seo-monitor-reports/2026-06-15T15-24-20-714Z-seo-monitor.md docs/seo-monitor-reports/2026-06-15T15-24-20-714Z-seo-monitor.json` passed after formatting; focused link presence check passed.
- Build blocker: `pnpm build` exceeded 10 minutes total wait and was stopped; output before timeout showed stale Browserslist data and `EPIPE` after the killed wrapper. Next fix is to rerun build in a longer-lived local/CI shell and inspect the first real Next.js error if it hangs again.
- Deployment: No commit, push, or Vercel deployment because full build validation timed out.
- Notes: Pre-existing dirty files and new unrelated/unowned untracked blog/social files were preserved and left unstaged.
