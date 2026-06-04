# Email System Contract

This document defines the supported CartShift email surfaces and queue payloads.
Generated files under `functions/lib/` must come from `cd functions && pnpm build`.

## Outbound Surfaces

- Transactional portal emails are sent from Firebase Functions through `sendPortalEmail`.
- Marketing nurture emails are scheduled in `marketing_email_jobs` and processed every 15 minutes.
- Newsletter and analyzer opt-ins create or update `marketing_leads`, enroll eligible contacts, and sync consenting contacts to the Resend audience.
- Contact-form submissions notify the agency team and create a lead, but do not enroll nurture unless explicit marketing consent is added later.
- Store-analysis reports are sent by `sendStoreAnalysisReport` with a PDF attachment.

## Supported Templates

The source registry in `functions/src/emails/email-service.ts` is the single source of truth.

- `new_request`
- `status_update`
- `milestone_completed`
- `quote_received`
- `payment_receipt`
- `new_comment`
- `contact_form_notification`
- `team_invite`

Any producer that writes `email_queue.templateName` must use one of these values.

## `email_queue` Payload

Required fields:

- `status`: must be `pending` for the create trigger to process it.
- `to`: recipient email string or string array.
- `subject`: email subject line.
- `templateName`: one supported template name.
- `data`: template props for the selected template.

Optional fields:

- `tags`: Resend tag array shaped as `{ name: string, value: string }`.
- `scheduledAt`: provider-compatible scheduled send time.

Lifecycle:

- `pending`: document was created and is eligible for processing.
- `processing`: function claimed the document.
- `sent`: provider accepted the send; `emailId` should be present when available.
- `failed`: validation, rendering, or provider delivery failed; `error` explains why.

## Consent And Tracking

- Marketing nurture jobs must only send when `marketingConsent` is true and the lead is not unsubscribed.
- Unsubscribe links use the lead unsubscribe token and cancel pending jobs.
- Click links only redirect to `cart-shift.com` or `www.cart-shift.com`; unsafe targets fall back to `/en/contact`.
- Marketing nurture emails include `List-Unsubscribe` headers and an HTML unsubscribe link.
