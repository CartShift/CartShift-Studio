# CartShift website remediation — release decision (2026-11-13)

**Status:** Code completed on draft PR #133; NOT merged or published to Production.
**Branch:** `fix/website-audit-20261113` based on Production `main` at `bebdf89cbb1a58820ccc2123991a20904a2ffd1e`.
**Owner approval:** required for Production deployment and for publishing any additional client outcome statements.

## Completed in code

- Repaired broken social OG PNG and Organization logo link.
- Replaced fake revenue/user illustration labels with neutral concepts.
- Repaired nested links/buttons across the marketing site, with a regression test.
- Kept the principal Free Expert Store Review CTA visible without JS and instrumented its click through existing consent-gated first-party funnel events.
- Reduced the blog index and homepage teaser's client payload by sending typed article summaries, not complete HTML.
- Fixed nonfunctional “Most popular” sorting and accessibility labels.
- Prioritized Shopify services, documented work, workflow and expert review on the homepage; retained client portal and analyzer on their dedicated pages.
- Added an explicitly illustrative 3-example review output to the review page, with locale-specific disclaimer in Hebrew, English and German.
- Labelled Honeypot theme/quiz as in client review across case-study locales. Stiletto remains clearly marked prelaunch; preserved original testimonial copies.
- Temporarily withheld Stiletto/Honeypot testimonials from public home and Honeypot detail pending source validation; no customer quotes were destroyed.
- Subsequent Preview HTML inspection found those hidden quotes were still serialized through the root locale provider. Original EN/HE/DE quote records and Honeypot case-study frontmatter were archived at `docs/editorial/held-case-study-quotes-2026-11-13.json` before removal from public message payloads and case-study metadata. Verify the final Preview does **not** contain these strings in the returned HTML/RSC scripts.
- Replaced unsupported public price cards, timelines and payment splits with written, project-specific quotes in all three locales; Hebrew FAQ reflects the documented default 50% deposit subject to written agreement.
- Improved form success announcement/focus and scroll anchor offset.
- Improved agency inbox notification eligibility to include both authorized `isAgency` and `accountType=AGENCY` owner/admin identities, dedupe, exclude suspended/ineligible users; added automated regression test.
- Added mobile Chromium click-through QA for homepage expert review and three-example disclosure; does not submit a live lead.

## Evidence and release gates

- Previous PR code version (commit `a88f2a7...`) had Vercel Preview READY, GitHub CI SUCCESS and German Chromium QA SUCCESS; 19 routes/assets returned HTTP 200.
- Previous blog index raw HTML size: 3,422,545 bytes Production -> 275,650 bytes Preview, ~92% reduction. This is **not** an independently measured LCP/INP/CLS improvement.
- **Latest head and CI must be rechecked after this document is committed.** Never use a previous commit's test status to assert latest branch passed.
- Verify final Vercel Preview is READY and conduct protected page/auth/SEO smoke for HE/EN; maintain German release gate (flags in QA only).
- Full live `POST /api/store-review-requests` test may only use an owned email/store with authorization; confirm Firestore persistence, agency portal listing, allowed notification, staff review/report and optional Resend delivery separately. No fake customer records or outbound email without authorization.
- Crosscheck named testimonials, third-party results, permissions and actual rollout of client themes with current first-party client confirmation. No claim of conversion/sales uplift without actual evidence.
- GA4/Search Console access and genuine funnel conversion baseline unavailable from connected read-only Vercel data; the current portal already includes first-party funnel metrics. Do not report invented lift.
- Pricing needs owner approval and each signed commercial proposal remains canonical over site copy.
- Run human visual QA on light/dark, mobile/desktop, RTL, keyboard, focus, contrast and Core Web Vitals. HTTP and desktop/mobile browser smoke are insufficient for WCAG compliance.
- Obtain explicit merge/production publish authorization. **Do not promote Vercel Preview to Production without it.**

## Rollback

- The public site remains on Production commit `bebdf89c...` until release approval.
- For a later failed release, use the known prior Production deployment in Vercel and revert the PR merge as appropriate.
- Existing `STORE_REVIEW_INTAKE_ENABLED` kill switch must not be changed without authorized incident response.

## Linked primary evidence

- https://github.com/CartShift/CartShift-Studio/pull/133
- https://cart-shift.com/he/free-store-review
- https://docs.google.com/document/d/1M8St4BUE5JtDnqeSAMZl8ydLdDQ119R749n_P8Y5eVQ/edit (business terms dated 2026-09-02)
- https://docs.google.com/document/d/1hnPmSvItl6VHZsblIrv-6z11hh41XFS7j8XMLsaVG1E/edit (Stiletto work; not current launch confirmation)
- https://docs.google.com/document/d/14z-S8SNyU0E9WVAtaq98mzsfXsXFz1SZvyDrt_sak8E/edit (Honeypot review; not current launch confirmation)

This document is an internal audit log, **not** a customer-facing success claim or authorization to merge.
