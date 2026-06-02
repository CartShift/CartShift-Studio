# SEO Automation Decision Log

This log records autonomous SEO publishing and refresh decisions for CartShift Studio.

The automation should append a new entry for every run, even when it decides not to publish or deploy.

## Entry Template

```md
## YYYY-MM-DD - Automation Name

- Outcome: Published | Refreshed | Skipped | Blocked
- Data sources used: Google Search Console, GA4, repo SEO docs, competitor research
- Opportunity: Query, page, topic cluster, or content gap selected
- Rationale: Why this was the strongest action for this run
- Target intent: Informational | Commercial | Comparison | Technical | Local
- Primary keyword:
- Supporting keywords:
- Affected files:
- Validation: Command and result
- Deployment: Command and result
- Notes: Follow-up risks, cannibalization checks, or next opportunity
```

## Runs

## 2026-05-25 - CartShift SEO Article Publisher

- Outcome: Blocked
- Data sources used: Credential requirements doc, `.env.local` key-presence check, repo blog inventory, automation memory check
- Opportunity: Not selected; Google Search Console and GA4 access were unavailable, so no query/page opportunity could be validated.
- Rationale: The automation requires non-interactive Google Search Console/GA4 access and Git access before publishing. `.env.local` contains `GOOGLE_APPLICATION_CREDENTIALS` as raw JSON, but the credential doc expects that variable to point to a service-account JSON file path; the required Search Console site and GA4 property variables were still missing.
- Target intent: Not applicable
- Primary keyword: Not selected
- Supporting keywords: Not selected
- Affected files: `docs/SEO_AUTOMATION_DECISION_LOG.md`
- Validation: Not run; publishing was blocked before content generation.
- Deployment: Not attempted; publishing remained blocked by incomplete Google Search Console/GA4 configuration and a dirty workspace.
- Notes: Found `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` without printing its value. Missing or unsupported credential categories: Search Console site (`GOOGLE_SEARCH_CONSOLE_SITE_URL`), analytics property (`GA4_PROPERTY_ID` or `GOOGLE_ANALYTICS_PROPERTY_ID`), and documented Google auth shape (`GOOGLE_APPLICATION_CREDENTIALS` should be a file path, or use `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`). Git status can be read with an explicit safe-directory override, and `origin` is configured for `https://github.com/CartShift/CartShift-Studio.git`, but push access was not verified.

## 2026-05-25 - CartShift SEO Article Publisher Access Recheck

- Outcome: Blocked
- Data sources used: `.env.local` key-presence check, Google OAuth service-account token exchange, Search Console Search Analytics API, GA4 Data API, Git status/remote/dry-run push
- Opportunity: Not selected; Google Search Console and GA4 access could not return usable query/page data.
- Rationale: The service account authenticated successfully, but Search Console returned `403` insufficient permission for the configured site, and GA4 rejected the configured property value because a numeric property ID is required.
- Target intent: Not applicable
- Primary keyword: Not selected
- Supporting keywords: Not selected
- Affected files: `docs/SEO_AUTOMATION_DECISION_LOG.md`, automation memory
- Validation: Not run; publishing was blocked before article generation.
- Deployment: Not attempted; Git push dry run to `origin/main` succeeded, but Google data access remained blocked.
- Notes: `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`, and `GA4_PROPERTY_ID` are present in `.env.local` without printing secret values. Required fixes: add the service account as a verified user/owner for `https://cart-shift.com/` in Google Search Console, and replace the current `GA4_PROPERTY_ID` value with the numeric GA4 property ID rather than the `G-...` measurement ID.

## 2026-05-25 - CartShift SEO Article Publisher Access Recheck 2

- Outcome: Blocked
- Data sources used: Automation memory, `.env.local` key-presence check, Google OAuth service-account token exchange, Search Console Search Analytics API, GA4 Data API, Git status, repo blog inventory
- Opportunity: Not selected; Google Search Console and GA4 did not return usable performance data.
- Rationale: The service account can authenticate, but Search Console still returns `403` insufficient permission for the configured site, and GA4 now reaches the property endpoint but returns `403` permission denied for the configured property.
- Target intent: Not applicable
- Primary keyword: Not selected
- Supporting keywords: Not selected
- Affected files: `docs/SEO_AUTOMATION_DECISION_LOG.md`, automation memory
- Validation: Not run; publishing was blocked before article generation.
- Deployment: Not attempted; Google data access remained blocked, though prior Git dry-run push access succeeded.
- Notes: Required fixes: grant the service account access to the Search Console property for `https://cart-shift.com/` and add the same service account to the GA4 property with at least Viewer access. The workspace remains dirty with many pre-existing modified blog files and tests, so future publishing should add only a new post and stage only automation-owned files.

## 2026-05-26 - CartShift SEO Article Publisher

- Outcome: Blocked
- Data sources used: Google Search Console via `sc-domain:cart-shift.com`, GA4 Data API, repo SEO docs, blog inventory, existing Shopify SEO articles
- Opportunity: Shopify SEO performance evaluation / review intent, surfaced by queries including `shopify seo evaluation review 2025 2026` at position 13, `evaluate the e-commerce platforms company shopify on best keywords` at position 10, and `shopify seo performance evaluation 2025 or 2026` at position 15.
- Rationale: The query cluster sits in the target 4-20 ranking range with 0% CTR and points to an intent gap around evaluating SEO performance, not another generic Shopify SEO guide. Existing posts cover the full Shopify SEO guide, audit checklist, and "improve results" workflow, so the new article is framed as a measurement and decision framework that links into those assets instead of duplicating them.
- Target intent: Informational | Commercial
- Primary keyword: Shopify SEO performance evaluation
- Supporting keywords: Shopify SEO review, Shopify SEO audit, Shopify SEO CTR, Shopify SEO rankings, Search Console Shopify SEO, GA4 organic landing pages
- Affected files: `content/blog/shopify-seo-performance-evaluation.md`, `docs/SEO_AUTOMATION_DECISION_LOG.md`, automation memory
- Validation: `pnpm exec prettier --check content/blog/shopify-seo-performance-evaluation.md` passed. `pnpm build` was attempted twice and timed out, first after 120 seconds with an `EPIPE` from the killed process and then after an extended run with no successful completion.
- Deployment: Not attempted; build validation did not complete successfully, so no commit or push was made.
- Notes: Search Console access works for `sc-domain:cart-shift.com`, while `.env.local` still lists `https://cart-shift.com/`; future runs should update `GOOGLE_SEARCH_CONSOLE_SITE_URL` to the accessible domain property or keep the domain-property fallback. GA4 access succeeded. Workspace still contains many pre-existing dirty blog/test files; only the new article and decision log should be staged when validation passes.

## 2026-06-02T15:30:06+03:00 - Blocked: local automation runner unavailable

- **Status:** Blocked before SEO analysis or editing.
- **Missing/unverifiable access category:** The Windows sandbox could not start any local process (`CreateProcessAsUserW failed: 5`). As a result, the automation could not verify the required non-interactive Google Search Console/GA4 credential variables or Git push access to `origin/main`.
- **Source data:** Not accessed. Google Search Console, GA4, repo SEO docs, and `content/blog/` inventory could not be inspected.
- **Chosen page:** None. No article was selected or modified.
- **Affected files:** `docs/SEO_AUTOMATION_DECISION_LOG.md` only.
- **Validation:** Skipped. `pnpm build` could not be started.
- **Deployment:** Skipped. No files were staged, committed, or pushed.
- **Likely fix:** Restore local sandbox process execution, then rerun the automation so it can verify credential variables and Git push access before making SEO changes.
