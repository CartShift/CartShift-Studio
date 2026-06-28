# Store Analyzer organic funnel

## Current architecture

CartShift uses Next.js 16 App Router with localized website routes, TanStack Query client mutations, and a long-running `/api/analyze-store` endpoint backed by `AnalyzerService`. Analyzer leads are sent to the existing Firebase `marketingCapture` function and stored in `marketing_leads`; PDF/email delivery is handled asynchronously by `sendStoreAnalysisReport`. Blog posts are Markdown frontmatter files rendered through `lib/markdown.ts`. Agency users manage marketing leads in `/portal/agency/leads`. Google Analytics is retained, with a privacy-safe first-party funnel event store added for reliable admin aggregation.

## Implementation and changed modules

- `lib/analyzer/funnel.ts`: intent types, deterministic primary-issue scoring, article mapping, and publication consent gate.
- `lib/services/analyzer-attribution.ts`: versioned first/last-touch local attribution.
- Analyzer page, API, result UI, and report delivery: intent and attribution propagation, issue-aware CTA, review form, and funnel events.
- `app/[locale]/(website)/tools/store-analyzer/[intent]`: canonical intent landing pages with unique metadata.
- `app/api/human-review` and `human_review_requests`: rate-limited manual review requests and internal agency notifications.
- `components/blog/ContextualAnalyzerCta.tsx` and Markdown frontmatter: automatic or overridden blog intent mapping.
- `app/[locale]/(website)/audit-insights/[slug]`: consent-gated educational insight template.
- Agency marketing dashboard/service: review moderation, partner reporting, issue/intent/source visibility, and funnel metrics.
- Firebase Functions report email: issue-specific summaries and Human Store Review action.

## Business logic decisions

Primary issue selection is deterministic. It weights section score deficits, recommendation impact/code evidence, Core Web Vitals, sampled product-page evidence, and verified cart interaction. A close or weak result falls back to `general_conversion`. Human reviews are a distinct low-friction stage and never imply unlimited free consulting. Public audit pages require stored anonymous consent; named case studies additionally require named-store consent. Scores and sensitive details are excluded from public templates.

## Data model changes

`marketing_leads` gains optional `analyzerIntent`, `primaryIssue`, `ctaType`, analyzer/report timestamps, first/last attribution, and `partnerCode`. `human_review_requests` stores qualifiers, status, qualification, visibility, random public slug, consent booleans/timestamp/version, and partner attribution. `analyzer_funnel_events` stores a random event id, session id, allow-listed event name, path, non-sensitive properties, and timestamps. Existing fields and lead IDs remain backward compatible; no destructive migration is required.

## Tracking events

`store_analyzer_viewed`, `store_analyzer_intent_selected`, `store_analyzer_url_submitted`, `store_analyzer_email_submitted`, `store_analyzer_started`, `store_analyzer_completed`, `store_analyzer_report_viewed`, `store_analyzer_cta_clicked`, `human_review_requested`, `human_review_submitted`, `booking_started`, `booking_completed`, `blog_analyzer_cta_viewed`, `blog_analyzer_cta_clicked`, and `partner_attributed` are allow-listed. Existing analyzer telemetry events remain unchanged.

## Assumptions

- Existing supported locales are English and Hebrew.
- Firebase Admin credentials remain available to server routes as they are for the rest of the app.
- Review capacity is operationally managed in the agency dashboard; messaging intentionally avoids guaranteed turnaround.
- Approved public insights are added to the sitemap at build time and remain private until an agency user changes visibility.

## Deployment

Deploy the updated Firebase Functions, Firestore rules, and indexes, then rebuild the Next.js application. No new environment variables are required.
