# Rendering and translation policy

CartShift has two runtime surfaces sharing one Next.js application. Keep their runtime contracts distinct without a premature monorepo migration.

## Marketing / editorial routes

- Public indexable marketing pages stay statically rendered when their data is available at build time.
- Blog article routes pre-render the **six newest articles per locale** at build time. Other article URLs generate on first request and are cached with ISR (1-hour revalidation). Changing this budget requires route-level build and first-hit comparisons.
- Use `routing.locales` rather than hard-coded locale arrays in `generateStaticParams`.
- Do not introduce request-only APIs (cookies, headers, session) into statically rendered routes.
- Preserve sitemap, canonical, hreflang, schema, EN/HE content and first-hit SEO parity.

## Authenticated portal routes

- Portal pages may fetch authenticated session data during requests. Tenant data must be authorized by the server before RSC dehydration and separately enforced by Firestore and Storage rules.
- The **portal layout** owns the locale message provider. Avoid nested `NextIntlClientProvider` instances in individual page components.
- TanStack Query hydrates secure prefetched data; individual pages should not copy an entire locale bundle just to create another provider.
- A client-only project detail route does not need static generation of individual customer project IDs.

## Translations

- `messages/src/{en,he}` are the editable sources. Do not edit generated `messages/en.json` or `messages/he.json`.
- Run merge and parity validation before production build; keep the generated artifacts deterministic.
- Prefer scoped translations in the owning layout and its child components. Do not add redundant providers for ordinary screens.
- Refactor custom i18n scripts only if a replacement retains key parity, interpolation consistency and generation diagnostics. Replacing `next-intl` is not the goal.

## Validation / release

1. CI: changed-file lint + focused Vitest; full typecheck/test/build at the integration gate.
2. Compare cold build route summary, number of pre-rendered blog articles and bundle transfer size against the baseline.
3. Check a recent and an older article (both locales) at first request and on refresh, metadata and actual rendered content.
4. Test authenticated dashboard display, loading/error states and translation fallback without a duplicate provider.
5. Avoid starting/stopping Vercel preview environments without a meaningful verification need.
