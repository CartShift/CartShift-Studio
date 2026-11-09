# Germany market launch — curated German marketing site

**Implementation status:** code complete for the initial public-marketing scope; **production release remains opt-in** pending verified legal and business details, content review and browser QA.

## Architecture

- One Next.js application, canonical `/en`, `/he`, and `/de` paths.
- `next-intl` handles navigation. English and Hebrew remain unchanged.
- `messages/src/de` provides approved German overrides; the generated `messages/de.json` is an English-key-complete fallback for internal components **only**.
- Only the paths in `lib/i18n/german-routes.ts` may be served in German. Other `/de/*` requests temporarily redirect to the matching `/en/*` URL.
- The German marketing layout does **not** expose the partially localized portal, newsletter widgets, testimonials or exit-intent modal.
- Canonical, hreflang and sitemap include DE only for genuinely localized and enabled paths.

## Implemented German pages

| Path | Intent |
| --- | --- |
| `/de` | Positioning for new online shops, store optimization, web development |
| `/de/solutions/shopify` | Shopify creation and development |
| `/de/solutions/wordpress` | WordPress websites |
| `/de/solutions/seo` | Technical SEO |
| `/de/about` | Studio and team credibility |
| `/de/work` | Project overview; English case studies clearly labeled |
| `/de/contact` | German enquiry form; accepted and stored as `locale=de` |

Excluded until fully localized: blog posts, full case-study details, tools, legal pages, standalone portfolio and client portal. **Do not add those paths to the allowlist unless their visible copy, metadata, schema, and forms are reviewed.**

## Deployment toggle

`NEXT_PUBLIC_GERMAN_MARKETING_ENABLED=true`

Default: unset/false in production. The exact feature branch `feat/german-market-launch-20261109` is also enabled automatically in Vercel **Preview only**, using the Vercel build environment and commit ref; `next.config.mjs` exposes a consistent, derived read-only toggle to the browser. Preview access must remain protected by Vercel SSO. This is a build-time public environment flag; redeploy after changing it. When off, `/de/*` temporarily redirects to the corresponding English path, is absent from sitemap/hreflang, and is hidden from the language selector.

## Required before public enablement

- [ ] Confirm full legal entity name, ladungsfähige Anschrift, contact details, and applicable VAT / Kleinunternehmer details with the business owner.
- [ ] Have a German legal professional review a real `Impressum` and German `Datenschutzerklärung` (including processors/analytics/cookies) and add linked, publicly accessible pages before enablement. **Do not launch with the temporary English-language legal links.**
- [ ] Review German copy with a native speaker, including claims about location and availability.
- [ ] Confirm active email notification pipeline handles DE enquiries and sends the internal link to the existing EN portal.
- [ ] Check the consent experience, analytics loading, accessibility and the German mobile navigation in browser QA.
- [ ] Review German forms on mobile and desktop, successful submission and error handling.
- [ ] Verify status 200 only for approved `/de` pages and 307 for untranslated pages, plus sitemap, canonical and hreflang in deployed Preview.
- [ ] Ensure Search Console property and sitemap submitted; monitor organic traffic and lead source after launch.

## Verification commands

```sh
pnpm install --frozen-lockfile
pnpm i18n:merge
pnpm i18n:validate
pnpm exec vitest run tests/lib/german-routes.test.ts
pnpm exec tsc --noEmit
pnpm build
```

Use a Vercel Preview deployment with `NEXT_PUBLIC_GERMAN_MARKETING_ENABLED=true` to perform browser QA *before* enabling the same flag in production. Do not deploy directly to production from this branch.

## Business workflow

- German outreach: send links to `/de` for new prospects; `/de/solutions/shopify` or `/de/solutions/wordpress` for platform-specific needs.
- Tag outreach campaigns with `utm_source=michael&utm_medium=outreach` or an internally approved attribution scheme. Do not put personal data in UTM parameters.
- Measure qualified DE leads and calls, not just page views. The contact handler persists `locale=de` for attribution.
- Expand translation by evidence: first high-converting service pages, then selected German case studies and educational content; do not publish machine-translated filler.
