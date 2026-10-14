# Store Analyzer: reliability and lead quality release gate (October 2026)

## Scope of the patch

- Never treat a partially returned PageSpeed/Lighthouse category set as four zero-score audits. When a required category is absent, switch to labeled static-HTML fallback for the whole set.
- Parallelize the small same-store product HTML sample set; tolerate individual product fetch failures while preserving confirmed-sample evidence and sample counts.
- Cap optional browser sampling time, and do not mark a cart click successful when Puppeteer could not click.
- Do not infer checkout failure merely because an add-to-cart probe was inconclusive.
- Prefer actionable measured/verified evidence to low-confidence low scores in the marketing lead's starting recommendation.
- Preserve scan method, report partiality, product-page count, browser coverage and key evidence in `analysisMetadata` for agency follow-up.
- Reserve `human_review_*` CTA markers for genuine human review requests. A normal audit is *not* a human-review conversion.
- Bound synchronous Firebase marketing capture to seven seconds so an unavailable CRM does not indefinitely hold the results response.
- Version the analysis cache so old scoring and missing data do not leak into updated reports.

## Before promotion / merge

1. Run the ten targeted analyzer test suites with `npm exec -- vitest run` (see the local test paths in `tests/services/analyzer-response.test.ts`, `tests/api/analyze-store-report-status.route.test.ts`, and the other analyzer-related files).
2. Run `npm run typecheck` after `node scripts/merge-translations.js --silent`, plus targeted ESLint against modified TS/TSX files. The remaining unrelated project typecheck issues must be fixed or explicitly resolved before merging.
3. Run controlled test scans on a public Shopify store, a public WooCommerce store, a non-store URL, and an unreachable/blocked store, with authorized test email accounts only. Check error copy, mobile results, recommendations, confidence badges, report links, and that no checkout/payment is attempted.
4. Exercise PageSpeed success, quota/429, incomplete category payload, browser-disabled, and browser-launch-failed paths. Confirm that partial scans are labeled, not represented as authoritative measurements, and avoid scoring all missing audits as zero.
5. Verify **one** CRM lead for a test email/store combination, its actual top evidence and analysis metadata, attribution, opt-in state, and that it is **not** tagged as a human-review request unless the separate review form is submitted.
6. Deploy the Firebase `marketingCapture` function change in a controlled release. Without that deployment, `analysisMetadata` will not persist in Firestore even though the analyzer sends it.
7. Validate the PDF/report delivery path independently; a `pending` response is *not* proof that an email has been delivered. Check function logs and inbox/spam on a real address.
8. Monitor production scan success rate, incomplete-scan rate, P50/P95 latency, report-send success, leads captured, genuine human-review requests, and qualified conversations. Only mark production-ready after acceptance checks pass.

## Known limitations not solved by this patch

- PDF generation starts after the Next.js API response, with a persisted Firestore retry record, a scheduled retry worker, and a read-only status endpoint. This is an improved recovery mechanism, not a guaranteed-once queue: if Firestore persistence is unavailable and the immediate sender fails, a report may still be lost. Verify acceptance and recovery in the deployed environment.
- The browser scan samples a small number of pages; it does not complete checkout, validate GDPR/WCAG compliance, prove lost revenue, or measure conversion rates.
- Email + URL alone does not verify store ownership, budget, sales volume, or purchase intent. Scoring should distinguish technical opportunity from actual commercial qualification.
- Third-party stores may block automated clients, render products only client-side, or serve login walls. Label evidence as unavailable rather than inventing an answer.
- No production smoke test was performed merely by merging a code change. Do not claim end-to-end working behavior without the checks above.

## Follow-up roadmap

1. Harden the existing Firestore retry path with production observability, alerting, dead-letter review, and end-to-end recovery tests.
2. Expand the new prioritized result summary with verified deep links to source pages and reusable remediation checklists.
3. Optional lightweight qualification *after* value delivery (role, biggest challenge, timeframe), not a high-friction lead gate on the URL form.
4. CRM view and dashboard funnel tracking from scan completion to human-review request to booked conversation and closed project.

## Required server configuration for signed delivery

The production Firebase function `sendStoreAnalysisReport` is no longer public. Set the **same** high-entropy `ANALYZER_REPORT_DELIVERY_KEY` in:

- Firebase Functions Secret Manager (via `firebase functions:secrets:set ANALYZER_REPORT_DELIVERY_KEY`)
- Vercel project environment for the deployed Next.js application.

Never put the key in `NEXT_PUBLIC_*`, GitHub, a URL, client-side JavaScript, or logs. Deploy the new Firebase Function and `retryStoreAnalysisReports` scheduled worker together with the web release. Until both sides are configured, report delivery is intentionally labeled `unconfigured`.

The retry worker runs once per hour and retries up to five times with a fixed Resend idempotency key. Because Resend retains idempotency keys for 24 hours and a PDF may contain changing render metadata, validate retry behavior with a real test recipient before promising guaranteed-once delivery. Persisted reports are stored with 30-day expiration; ensure Firestore TTL policy deletes them.

## Test execution (October 14)

60 tests passed across ten analyzer-related suites on the authorized local laptop. Targeted ESLint passed, and canonical translation regeneration plus translation validation passed. Both English and Hebrew report PDFs were successfully generated with the local Chromium executable using synthetic store-analysis fixtures (not production emails). Full-repository TypeScript initially showed 59 errors; regenerating the canonical messages reduced that to 18 unrelated baseline errors, primarily missing function-email dependencies in the temporary local dependency layout and pre-existing MCP test types. No TypeScript errors were found in the modified analyzer paths. Full Next.js build and live Firebase/Resend delivery remain unverified because the clean checkout has no configured production Firebase environment variables. Do not claim production readiness from the unit tests alone.

## Security scope of browser audits

The scraper validates and intercepts requested HTTP(S) resource origins, blocking explicitly private/internal hosts and disallowed protocols before Chromium fetches them. DNS responses can change between validation and the browser connection (DNS rebinding), so this is defense-in-depth and **not a complete security guarantee**. Before enabling untrusted browser scans at larger scale, put Chromium in isolated egress-restricted infrastructure and enforce network-level denial of metadata/internal IP ranges. Do not treat this middleware alone as an SSRF-proof sandbox.

## Production bot-protection gate

`RECAPTCHA_SECRET_KEY` is required in the production Next.js environment. The v3 token must have `action=analyze_store`, a score of at least 0.5 and an allowed CartShift domain. If the secret is missing or verification fails, scans are rejected instead of allowing unauthenticated resource-heavy requests. Configure a matching `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and confirm live-domain verification before release.

## Visual audit disclosure

The analyzer may use transient Chromium screenshots to compute visual signals, but the current PDF report template does **not** embed those screenshots. Public API results and report delivery payloads discard the heavy image data intentionally. Do not promise screenshots in the PDF until image retention and a tested PDF image section are implemented. The report continues to contain visual metrics and grounded text evidence.
