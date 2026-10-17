# CartShift: public content audit — 17 October 2026

## Scope and implementation

This pass covers the marketing home, about, contact, 3 platform solutions, 3 dedicated Shopify services, six industry pages, review funnel, price and maintenance offers, work archive and nine case studies, blog archive and 37 bilingual posts, tools/client portal, privacy and terms. The review and the legacy analyzer entry points are both exercised in the route smoke script.

## Editorial and product rules applied

- Genuine client testimonials are restored to the homepage; quotes remain as supplied in the translation and case-study sources. Do not invent measured effects from them.
- Positioning is Shopify-first, with WordPress and custom apps as complementary capabilities.
- Free first-pass expert review, paid full-store audit and paid SEO audit each have explicit scope boundaries.
- Unsupported industry counters and always-available support figures are removed.
- The Stiletto new-theme project is explicitly marked as prelaunch rather than presenting the redesigned theme as live.
- Pricing and maintenance are currently controlled by client-only Firestore flags. Until that visibility is server-enforced, they are `noindex` and excluded from the sitemap. Their commercial terms still need owner sign-off before paid campaigns.
- About, Shopify and review landing editorial content share translation sources; contact, blog, client portal and legal metadata are localized.

## Read-only route verification

1. Run `node scripts/merge-translations.js --silent`, `node scripts/validate-translations.js`, TypeScript and relevant tests.
2. Build with deployment-provided Firebase variables or *isolated nonfunctional* build-only placeholders.
3. Start a local optimized server, then run `node scripts/audit-public-pages.mjs http://127.0.0.1:3005`.
4. Check Vercel production build, custom domain mapping, and runtime errors after release. Do not send a fake lead.

## Remaining human checks

- Confirm published website screenshots, especially Stiletto, against the actual release status before removing the prelaunch label.
- Confirm pricing, 24/48-hour plan SLAs and any service-contract terms with the owner; copy cannot substitute a signed agreement.
- Verify real capture of a consented lead, email delivery, CRM handoff, GA4/GSC traffic attribution and conversions.
- Conduct visual and keyboard/accessibility review on real desktop and mobile devices; a DOM smoke test is not a substitute.
- Where external social profiles or third-party badges are used, keep only destinations and claims the studio controls or can validate.
