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

## 2026-06-22 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-06-22T12-25-26-751Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-06-22 - LLM SEO Release Decision

- Outcome: Narrow content fix prepared; release blocked by shared build contention
- Run time: `2026-06-22T15:27:20+03:00`
- Data sources used: Fresh monitor report `docs/seo-monitor-reports/2026-06-22T12-25-26-751Z-seo-monitor.{md,json}`, Search Console Search Analytics and URL Inspection, GA4, live response headers and rendered metadata, live sitemap, git history, and repo blog inventory
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK with `siteFullUser`
- Top evidence: Search Console reports `/en/blog/shopify-seo-complete-guide` and `/en/pricing` as `Crawled - currently not indexed`; both were successfully fetched with indexing allowed. The Shopify SEO guide's last recorded crawl was April 26, 2026, but the repo refreshed the article on June 16, 2026. `/en/terms` is now `Submitted and indexed` after a successful June 20 crawl. The submitted sitemap has zero warnings or errors.
- Technical diagnosis: Live pricing and Shopify SEO pages return HTTP 200, `index, follow`, self-referencing canonicals, English/Hebrew/x-default alternates, and are present in the live sitemap. Default `/blog/*` redirects to `/en/blog/*`, and Markdown blog links are already localized during rendering. No deterministic metadata, robots, canonical, hreflang, or sitemap defect was found.
- Analytics caution: GA4 showed many prior-session routes with zero current sessions, including authenticated portal paths, so this was treated as a measurement/period signal rather than evidence for an automated public-page rewrite.
- Chosen action: Added one natural internal link in both the English and Hebrew sections of `content/blog/amazon-fba-vs-shopify-2026.md` to the refreshed Shopify SEO pillar. The monitor's follow-up inventory no longer flags this article for having few internal links.
- Files touched by this monitor: `content/blog/amazon-fba-vs-shopify-2026.md`, `docs/SEO_MONITOR_DECISION_LOG.md`, `docs/seo-monitor-reports/2026-06-22T12-25-26-751Z-seo-monitor.md`, and `docs/seo-monitor-reports/2026-06-22T12-25-26-751Z-seo-monitor.json`
- Focused validation: Prettier passed for the article; both localized link source strings were confirmed; `git diff --check` passed.
- Build blocker: `pnpm build` compiled successfully in 93 seconds and completed TypeScript in 5.7 minutes, then failed during page-data collection with `ENOENT` for `.next/static/.../_clientMiddlewareManifest.js`. A second unrelated `pnpm build` had started in the same worktree and was writing the shared `.next` directory, confirming a build-artifact race. The competing automation later also reported long-running static-generation workers, so no destructive cache cleanup or further shared build retry was attempted.
- Commit and push: Not attempted because full production build validation did not pass. All files remain unstaged.
- Deployment: No Vercel deployment is expected from this monitor run.
- Likely next fix: Run `pnpm build` in an isolated CI checkout or after all other worktree builds stop; if it still hangs after generating routes, investigate the existing static-generation worker timeouts before releasing either pending SEO article change.
- Worktree safety: Unrelated social ledger/queue changes, the concurrent `content/blog/headless-shopify-guide.md` article, and `docs/SEO_AUTOMATION_DECISION_LOG.md` were preserved and left unstaged.

## 2026-06-29 - CartShift SEO Technical Monitor

- Outcome: Safe internal-link fix validated and released
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK with `siteFullUser`
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top evidence: `/en/blog/shopify-seo-complete-guide` and `/en/pricing` remain `Crawled - currently not indexed`; the Shopify guide's recorded crawl is April 26 and pricing's is April 20. `/en/terms` remains submitted and indexed. Search Console found zero submitted-sitemap warnings or errors. The strongest CTR opportunity was `shopify seo review` with 44 impressions, 0 clicks, and average position 17.3.
- Technical diagnosis: Both non-indexed pages return live HTTP 200 responses with `index, follow`, self-referencing canonicals, correct locale alternates, and live sitemap membership. The default `/blog/shopify-seo-complete-guide` path returns a 307 to `/en/blog/shopify-seo-complete-guide`, and raw Markdown blog links are localized during rendering. No deterministic robots, canonical, hreflang, metadata, or sitemap defect mapped to a safe repo fix.
- Analytics caution: GA4 access succeeded, but its largest declines were authenticated portal routes with zero current sessions; this was treated as a period/measurement signal rather than evidence for a public SEO rewrite. The 44-impression CTR sample also did not justify rewriting an already intent-aligned title.
- Chosen action: Added one natural link to `/blog/conversion-audit-checklist` in both English and Hebrew sections of the underlinked abandoned-cart guide. The existing Markdown renderer will emit `/en/blog/*` and `/he/blog/*` crawl paths.
- Files touched: `content/blog/abandoned-cart-recovery-strategies-2026.md`, this decision log, and `docs/seo-monitor-reports/2026-06-29T13-15-36-915Z-seo-monitor.{md,json}`.
- Validation: Prettier passed for all touched files, both localized link strings were confirmed, `git diff --check` passed, and `pnpm build` completed successfully. Next.js compiled in 2.5 minutes, completed TypeScript in 4.1 minutes, and generated all 211 static pages after automatic timeout retries.
- Commit and push: Pending final staging at the time of this log entry; only the four automation-owned paths above will be staged.
- Deployment: Vercel deployment is expected after the validated commit reaches `origin/main`.
- Notes: No property mismatch or unrelated worktree changes were present.

### 2026-06-29 follow-up: remaining content-quality action

- Trigger: The user asked to continue through the monitor's prioritized findings after commit `dace3a6`.
- Decision: Technical indexing signals still have no deterministic repo defect, and the 44-impression CTR sample remains too weak for a safe title rewrite. The remaining repo-backed content issue was `tiktok-shop-complete-guide-2026`, which had no internal blog links.
- Chosen action: Added one natural link in both English and Hebrew to `/blog/product-photography-ecommerce-guide`; the Markdown renderer localizes the crawlable URLs by locale.
- Files touched: `content/blog/tiktok-shop-complete-guide-2026.md` and this decision log.
- Validation: Prettier, localized link checks, and `git diff --check` passed. `pnpm build` compiled in 3.3 minutes, completed TypeScript in 2.7 minutes, and generated all 211 static pages after automatic timeout retries.
- Release: Validation passed; only the TikTok article and this decision-log update are eligible for the follow-up commit and push to `origin/main`.

## 2026-07-05 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-07-05T13-04-31-191Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-07-13 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-07-13T11-29-29-993Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-07-13 - LLM SEO Release Decision

- Outcome: No safe technical SEO code change applied
- Run time: `2026-07-13T11:29:29Z` to `2026-07-13T11:43Z` UTC
- Data sources used: Fresh monitor report `docs/seo-monitor-reports/2026-07-13T11-29-29-993Z-seo-monitor.{md,json}`, Search Console URL Inspection, GA4, live HTML responses, live redirects, and local sitemap/metadata/blog route code
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK with `siteFullUser`
- Top evidence: Search Console still reports `https://cart-shift.com/en/blog/shopify-seo-complete-guide` and `https://cart-shift.com/en/pricing` as `Crawled - currently not indexed`, while `https://cart-shift.com/en/terms` remains submitted and indexed. The strongest CTR sample is still `shopify seo review` on the performance-evaluation article with 132 impressions, 0 clicks, and average position 18.3.
- Technical diagnosis: Live checks show `/en/blog/shopify-seo-complete-guide` and `/en/pricing` both return HTTP 200 with `index, follow` and self canonicals, and the default `/blog/shopify-seo-complete-guide` path returns an HTTP 308 redirect to the English locale. `app/sitemap.ts` already emits localized blog, pricing, and root URLs with hreflang alternates. No deterministic robots, canonical, hreflang, redirect, or sitemap defect mapped to a safe repo edit.
- Analytics caution: The large GA4 drops are still concentrated in authenticated portal paths and other non-public routes, so they were treated as measurement or period signals rather than public SEO regressions that should trigger content rewrites here.
- Chosen action: Preserve the repo state, make no speculative metadata or internal-link change, and record this as a Search Console re-crawl or content-quality follow-up rather than a technical release candidate.
- Files touched: `docs/SEO_MONITOR_DECISION_LOG.md`
- Validation: `git diff --check` should pass after this log-only update. Full `pnpm build` was intentionally skipped because no production code or content changed in this decision pass.
- Commit and push: Not attempted because no safe repo fix was applied. Report artifacts were left unstaged.
- Deployment: No Vercel deployment is expected from this run.

## 2026-07-23 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-07-23T11-29-11-109Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-08-06 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-08-06T04-46-25-199Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-08-06 - Unified SEO Release Decision

- Outcome: Fresh scan reviewed; no safe technical SEO code change applied.
- Run time: `2026-08-06T04:46:15Z` to `2026-08-06T05:01Z` UTC.
- Data sources used: Fresh monitor report `docs/seo-monitor-reports/2026-08-06T04-46-25-199Z-seo-monitor.{md,json}`, Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, live HTML responses, live sitemap, local `app/sitemap.ts`, local blog metadata generation, repo strategy docs, and current blog inventory.
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK with 148 rows.
- GSC access: OK with `siteFullUser`; URL Inspection checked 15 URLs and the submitted sitemap had zero warnings or errors.
- Top evidence: URL Inspection reports `https://cart-shift.com/en/blog/shopify-seo-complete-guide` and `https://cart-shift.com/en/pricing` as `Crawled - currently not indexed`. The Shopify SEO guide also shows a 355-to-12 impression decline, while the strongest CTR opportunity remains `shopify seo review` on `content/blog/shopify-seo-performance-evaluation.md` with 251 impressions, 0 clicks, and average position 17.9.
- Technical diagnosis: Live checks show `/en/blog/shopify-seo-complete-guide` and `/en/pricing` both return HTTP 200 with `index, follow`, self-referencing canonicals, and sitemap membership. The default `/blog/shopify-seo-complete-guide` path returns a 308 redirect to `/en/blog/shopify-seo-complete-guide`. Local metadata and sitemap code already emit localized canonicals and alternates. No deterministic robots, canonical, hreflang, redirect, or sitemap defect mapped to a safe repo edit.
- Decision: Preserve production code and content. Treat the Search Console findings as re-crawl/index-quality follow-up evidence rather than an automated technical fix, and avoid refreshing the Shopify SEO review article while it remains inside the 21-day cooldown.
- Files touched: `docs/SEO_MONITOR_DECISION_LOG.md` and `docs/SEO_AUTOMATION_DECISION_LOG.md`; fresh generated report artifacts were kept ignored and unstaged.
- Validation: `pnpm exec prettier --check docs/SEO_AUTOMATION_DECISION_LOG.md docs/SEO_MONITOR_DECISION_LOG.md`, `git diff --check -- docs/SEO_AUTOMATION_DECISION_LOG.md docs/SEO_MONITOR_DECISION_LOG.md`, and `pnpm build` passed. The build generated all 221 static pages after automatic retries for existing slow static routes.
- Commit and push: Validation passed; only docs-owned decision logs are being staged for a docs-only commit and push to `origin/main`.
- Deployment: No Vercel-impacting deployment expected because no production code or content changed.

## 2026-08-19 - CartShift SEO Technical Monitor

- Outcome: Reported
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: `sc-domain:cart-shift.com`
- GA4 access: OK
- GSC access: OK
- URL Inspection coverage: 15 URLs checked
- Sitemap API coverage: 1 submitted sitemap entries checked
- Top issue: Search Console technical
- Recommended action: Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.
- Affected files: `docs/seo-monitor-reports/2026-08-19T09-57-21-891Z-seo-monitor.md`
- Validation: Report generated; no code/content changes applied.
- Deployment: Not attempted by monitor script.
- Notes: No property mismatch detected.

## 2026-08-19 - Unified SEO Release Decision

- Outcome: Fresh scan reviewed; no safe technical SEO code or content change applied.
- Run time: `2026-08-19T09:56:37Z` to `2026-08-19T10:10:08Z`.
- API status: Search Console OK for `sc-domain:cart-shift.com` with `siteFullUser`; query/page APIs OK, one sitemap inspected with zero warnings or errors, 15 URLs inspected, and GA4 OK with 151 rows.
- Top evidence: Search Console reports the legacy `/blog/shopify-vs-woocommerce` URL with Google canonical on the legacy path while the declared canonical is `/en/blog/shopify-vs-woocommerce`; it also reports `/en/blog/shopify-seo-complete-guide` as `Crawled - currently not indexed`, with impressions down from 366 to 1. The strongest CTR signal is `shopify seo review` at 312 impressions, 0 clicks, and average position 17.8.
- Technical diagnosis: Current Googlebot checks show the legacy comparison URL returning a permanent 308 to `/en/blog/shopify-vs-woocommerce`; English and Hebrew targets return 200 with self canonicals and correct hreflang alternates; the live sitemap contains localized comparison URLs only; the two GSC-recorded referrers no longer expose the legacy link; and `lib/markdown.ts` already localizes raw Markdown blog links. The comparison crawl was July 17, while current live behavior is deterministic and clean. The Shopify SEO guide's April 26 crawl predates its June 30 refresh, and the SEO review article's June 21 crawl predates its July 23 refresh.
- Decision and outcome: Preserve production code and content. Treat the canonical mismatch as a stale or not-yet-reprocessed Search Console signal unless a future crawl reproduces it, and avoid speculative re-refreshes until Google processes the current article versions.
- Files touched: `docs/SEO_MONITOR_DECISION_LOG.md`, `docs/SEO_AUTOMATION_DECISION_LOG.md`; ignored fresh report artifacts were not staged.
- Validation: Focused Prettier formatting and targeted `git diff --check` passed. `pnpm build` passed translation validation, compiled in 56 seconds, completed TypeScript in 86 seconds, and generated all 223 static pages in 2.3 minutes.
- Commit and push: Validation passed; only the two decision logs are eligible for a docs-only release.
- Deployment: No Vercel-impacting deployment is expected because production code and content are unchanged.
