# SEO Automation Credentials

The SEO automations need non-interactive access to analytics and deployment services.

## Required Environment

Use the automation environment, local shell profile, CI secrets, or another Codex-supported secret source. Do not commit real secrets to this repo.

### Google Search Console and GA4

Provide one of these authentication patterns:

- `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service-account JSON file available to the automation
- Or `GOOGLE_APPLICATION_CREDENTIALS` containing the full service-account JSON in environments that support multiline secret values
- Or `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`

Also provide:

- `GOOGLE_SEARCH_CONSOLE_SITE_URL`
- `GA4_PROPERTY_ID` or `GOOGLE_ANALYTICS_PROPERTY_ID`

For CartShift Studio, the Search Console service account currently has access to the domain property:

- `GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:cart-shift.com`

If `GOOGLE_SEARCH_CONSOLE_SITE_URL` is set to a URL-prefix property such as `https://cart-shift.com/`, the monitor can fall back to the visible domain property, but the env value should still be updated for cleaner recurring runs.

### Git/Vercel Deployment

No Vercel API credentials are required for these SEO automations.

After validation succeeds, the automation should commit its SEO changes and push them to the main branch. Vercel will deploy through the repository's Git integration.

The automation environment must have permission to:

- Create commits
- Push to `origin/main`
- Read the repository status before editing

## Safety Rule

If required Google credentials or Git push access are missing, the automation should skip publishing/deployment and append a blocked run to `docs/SEO_AUTOMATION_DECISION_LOG.md`.
