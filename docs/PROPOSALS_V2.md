# CartShift Proposals 2.0

## Why

The client approves a **commercial agreement**, not a mutable internal task. The original Arava quote included a scoped breakdown, estimated hours, client prerequisites, a capped hourly rate, exclusions, payment terms, and a start condition. These must be reviewable together and retained as the exact version approved.

## Sources of truth

- `portal_requests/{requestId}`: editable commercial **working document** before acceptance, canonical request + billing state. Existing non-proposal requests remain supported.
- `portal_requests/{requestId}.publishedProposal`: server-written snapshot of the *latest version sent*, read by the public portal until a new version is published. Work-in-progress revisions must never appear publicly.
- `portal_requests/{requestId}/versions/{version}`: server-authored immutable historical snapshot. Write and read from privileged server paths only. No direct client Firestore access.
- `portal_requests/{requestId}.proposalVersion`: monotonically increasing integer; acceptance includes expected version, preventing acceptance of an outdated client tab.
- `portal_requests/{requestId}.proposalContent`: new structured document. Missing content gracefully falls back to existing summary/line item layout.
- `portal_requests/{requestId}.relatedRequestId`: independently billable change order linked to an existing accepted request; never reprices the approved original.
- `portal_requests/{requestId}.proposalRequirementStatuses`: admin-only operational statuses; not part of the contractual snapshot and cannot change legal commitments.
- `portal_payments`: existing canonical payments ledger; do not duplicate payment documents in a second proposal-specific collection.

## Commercial pricing and deposit

| Mode | Shown to client | Commercial meaning |
| --- | --- | --- |
| Fixed | Line-item total, tax, deposit | Price for agreed scope |
| Hourly estimate | Rate, hour range, price range | Forecast; no invented price guarantee |
| Capped hourly | Rate, hour range, upper approved cap | Actual approved billable maximum from line items; must be at least the estimated upper range |

All amounts are stored as **integer minor currency units**, not floats. Tax is applied through the canonical request functions. Deposits are explicitly set against the approved gross total; the Arava-style template defaults to 50%. New estimates do not set customer-specific rates unless a template is intentionally applied.

## Example: Arava / Blackwood

Optional template prefills a rate of ₪250 before tax, a 12–16 hour estimate (₪3,000–4,000 before tax), 5–8 business days, a 50% deposit and a requirement checklist. **It does not prepopulate fictional SKU counts, inventory facts or exact dates.** The original proposal mentioned 17 products/33 variants; later execution narrowed to 16/32. The sent commercial snapshot intentionally remains unchanged.

## Flow

1. Agency drafts from `/pricing/new`, optionally after selecting a client or request.
2. Agency saves, reviews, then *sends*; the server writes a new immutable version and queues email. Email queued is **not** email delivered.
3. Client opens public link without portal registration. They may print/download a PDF, approve the **current** version, or request changes.
4. Change request is recorded as a public comment on the canonical request and moves offer to `CHANGES_REQUESTED`.
5. Agency edits and resends a new numbered version. Unsaved edits do not affect the public document.
6. Client approval is recorded via server transaction with version, name, timestamp and typed signature. An approved proposal is locked; future scope changes require a new linked change order.
7. Deposit record and client requirements are tracked separately. Start-work UI blocks beginning quoted work until signature, deposit and required materials are marked approved; server-side status and authorization require end-to-end security review before go-live.
8. Proposals with multiple linked requests materialize work items using the existing commercial bundle logic after deposit conditions are satisfied.

## Security and compatibility

- Public proposal reads and feedback have rate limits; feedback is not an authorization to change pricing.
- The signed version is bound to its previously published snapshot.
- Non-agency users cannot directly write protected commercial fields or bypass signed acceptance for published versioned proposals; version snapshots are not client-writeable.
- Existing proposals without `publishedProposal` or structured content keep the original public layout.
- Do not assume the legacy request actions use the new signed public flow; verify both paths on staging.
- PDF endpoint renders a same-origin server-configured public URL with no untrusted Host redirects.

## Release checks — required before merging

- [ ] Test Firestore emulator / staging authorization (agency vs client, old and newly versioned records).
- [ ] Verify old records and imported legacy quotes continue to display/approve correctly.
- [ ] Test create > save > send > sent snapshot > edit > resend > sign current version > paid deposit.
- [ ] Verify outdated version acceptance is rejected and unsigned client SDK acceptance is rejected.
- [ ] Test feedback, email notification queue and email **delivery** failures.
- [ ] Confirm true payment capture, manual payment reconciliation and partial payment totals.
- [ ] Verify quote-linked requests are materialized at the correct billing point, once.
- [ ] Confirm start-work gate for unsigned offers, outstanding deposits and incomplete materials.
- [ ] Verify PDF export on the actual serverless runtime, with legible Hebrew fonts, RTL alignment, A4 pagination and no hidden content.
- [ ] Verify editor and public link on responsive mobile and desktop.
- [ ] Verify changed Firestore security rules are deployed *with* the feature, not separately.
- [ ] Review tax handling and offer terms under applicable jurisdiction.
- [ ] No emails, charges, migrations or production publishing during QA without explicit authorization.

## Follow-on scope (NOT implemented here)

AI-assisted draft generation from audits and discovery calls; automated follow-up reminders based on verified email delivery status; cross-client win-rate and conversion dashboards; import of historic Google Docs into structured versioned proposals; reusable catalog of services beyond the Shopify template.
