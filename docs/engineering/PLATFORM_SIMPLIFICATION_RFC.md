# CartShift Platform Simplification — Engineering RFC

**Status:** Incremental implementation PRs open; not fully validated or merged  
**Baseline:** `main` at `4aebac6ba2f75eca6d72046fa70020fae7f4a0ae`, inspected 2026-10-09  
**Scope:** CartShift Studio portal, reusable UI and frontend infrastructure  
**Owner:** CartShift Studio  
**Related guidance:** [AGENTS.md](../../AGENTS.md), [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), [Testing](../TESTING.md), [Design system optimization](../DESIGN-SYSTEM-OPTIMIZATION.md)

> This RFC is an actionable migration plan, **not** a claim that any migration or test has been executed. File sizes and observations reflect the inspected repository snapshot; older review documents may be stale.

## 1. Executive decision

**Simplify by consolidation first; adopt a library only when it demonstrably replaces complex behavior.** No rewrite, no new product scope, no unnecessary backend migrations.

- **Keep:** Next.js App Router, React, Firebase, TanStack Query, React Hook Form, Zod, Radix UI, Sonner, dnd-kit, CVA, next-intl, date-fns, current CartShift design tokens.
- **Consolidate:** duplicate request/proposal forms; search data/keyboard interactions; notification API; repeated table state where appropriate.
- **Evaluate behind a compatibility gate:** cmdk for command menus, Driver.js for onboarding tours, `@tanstack/react-table` for complex tables, Floating UI or Radix composition for mention suggestions.
- **Do not add without evidence:** full rich-text editor just for mentions, a second design system, generic global state store, new database/cache layer, or infrastructure solely to replace an existing working utility.

## 2. Goals, non-goals, and invariants

### Goals

1. Fewer independent implementations of equivalent behaviors.
2. Lower cognitive complexity in high-change screens and easier targeted testing.
3. Better keyboard, focus, screen reader, mobile and RTL parity without changing CartShift visual identity.
4. Preserve existing user flows, translations, data contracts, domain calculations and permissions.
5. Quantify improvements using a before/after inventory, regression results and runtime measurements, rather than estimated bundle or LOC savings.

### Non-goals

- Replacing Firestore, authentication, hosting, payments, or overall project architecture.
- Redesigning the portal or introducing shadcn/ui wholesale.
- Rewriting pricing/domain rules as generic form utilities.
- Migrating every presentational table to TanStack Table.
- Adding Tiptap/Slate merely to suggest `@mentions`.
- Converting a planning PR into an unreviewed mass code refactor.

### Mandatory invariants

- Tenant isolation: a client can never see another organization's data in search, suggestions, caches or network responses; agency role permissions remain authoritative.
- Existing request creation/editing, attachments, request type/priority handling, billing/proposals, deposits, approvals and payments behave identically unless a separately approved product change specifies otherwise.
- Hebrew RTL and English LTR, both light/dark modes, mobile touch targets and accessible interaction are release blockers.
- Existing Firestore rules, API authorization and server-side validation stay effective. UI filtering is never treated as authorization.
- TanStack Query remains the canonical server-state cache; Firestore operations live in services/hooks, not UI components.
- Preserve `messages/src/{locale}/` as translation source; never edit generated locale bundles directly.
- Preserve `prefers-reduced-motion` and current branding.

## 3. Evidence and opportunities (verified by reading source files)

| Finding | Existing files | Evidence | Direction |
| --- | --- | --- | --- |
| Duplicated request form flows | `components/portal/forms/CreateRequestForm.tsx` (358 lines), `components/portal/forms/RequestForm.tsx` (432 lines), `RequestFormCoreFields.tsx` | Each uses very similar useForm + Zod, file attachment handling, agency/client selection and request submission. A shared core already exists but not the full workflow. | Shared schema, field blocks and submission controller; route-specific shells stay thin. |
| Large, parallel proposal forms | `app/[locale]/portal/(workspace)/pricing/new/CreatePricingForm.tsx` (905 lines), `app/[locale]/portal/(workspace)/pricing/[pricingId]/edit/EditPricingForm.tsx` (895 lines) | Parallel line-item, pricing, validation and submit UI; each uses React Hook Form and useFieldArray. | Shared proposal editor and canonical form/model conversions; protect domain behavior. |
| Multiple manually orchestrated search surfaces | `components/portal/CommandPalette.tsx` (361 lines), `components/portal/ui/GlobalSearch.tsx` (144 lines), `components/portal/ui/MobileSearch.tsx`, `components/portal/shell/PortalShell.tsx` | The command palette and global search each manage active result and arrow-key navigation. PortalShell and CommandPalette each have shortcut listeners to audit. | Shared permission-aware search model, one keyboard interaction implementation, distinct desktop/mobile shells only when necessary. |
| Custom onboarding positioning engine | `components/portal/OnboardingTour.tsx` (399 lines) | Calculates target rectangles, reacts to resize, scrolls targets, intercepts keys and renders custom overlay. | Driver.js proof of concept; keep localized content and user completion semantics. |
| Presentational table plus bespoke state | `components/portal/ui/PortalTable.tsx` (143 lines), `app/[locale]/portal/(workspace)/requests/RequestsClient.tsx` (1,056 lines) | PortalTable provides visual primitives; RequestsClient has local filter/sort/pagination/selection logic. | Retain PortalTable styling; evaluate TanStack Table only for data-heavy screens. |
| Handwritten mention suggestion behavior | `components/portal/ui/Discussion/MentionInput.tsx` (173 lines) | Parses @ from plain textarea, manages active option, key handling, cursor insertion. | Improve with existing Radix/combobox patterns first; evaluate caret anchoring only if required. |
| Multiple toast interfaces | `components/ui/Toast.tsx` (258 lines), `lib/utils/portal-toast.ts` | Both use Sonner. `useToast().toasts` returns an empty compatibility placeholder. | Choose one Sonner adapter; maintain temporary backwards compatibility; migrate call sites deliberately. |
| Existing shared foundations are sound | `components/ui/Select.tsx`, `Dropdown.tsx`, `ConfirmationModal.tsx`, `Tooltip.tsx`, `ModalBackdrop.tsx` | Already built on Radix rather than handwritten focus/modal primitives. | Keep and refine; don't replace for replacement's sake. |
| Existing tests, but migration scenarios need coverage | `tests/portal/requests.test.tsx`, `tests/portal/portal-shell.test.tsx`, `tests/domain/proposal-content.test.ts`, `tests/api/cartshift-mcp-isolation.test.ts` | Framework and relevant domain cases exist; no guarantee they currently cover all proposed keyboard/RTL/business paths. | Establish baseline and add targeted regression tests before replacing implementation. |

Important: source line counts are a complexity signal, **not** proof of duplication quantity, bug frequency, or performance impact. The previous `docs/CODE_REVIEW.md` and `docs/DESIGN-SYSTEM-OPTIMIZATION.md` are historical notes; validate findings against current code before applying them.

## 4. Target boundaries

`components/ui/` → stable, accessible Radix-backed/CVA visual primitives.  
`components/portal/ui/` → portal visual compositions that genuinely add semantics, not shallow aliases.  
`components/portal/{forms,pricing,search,tables}/` → feature-specific composition; no Firestore access.  
`lib/hooks/` → authenticated React Query / subscriptions / mutations / invalidation.  
`lib/services/` → Firebase, APIs, authorization-sensitive operations.  
`lib/domain/` → deterministic business rules, pricing, workflow and serialization.

Do not create a generic framework around simple code. Prefer a narrowly named reusable module only after at least two current call sites justify it.

## 5. Workstreams and technical designs

### WS-0 — Baseline, dependency gate, and contract tests (P0; mandatory first)

**Affected:** `package.json`, `pnpm-lock.yaml`, `vitest.config.ts`, `tests/`, relevant portal code.

- Record baseline installed dependency tree, `pnpm` lockfile state, current tests/typecheck/lint/build status and representative route bundle sizes in a reproducible report. A green baseline must be *observed*, not assumed.
- Inventory all call sites of duplicate forms, search surfaces, toasts, modal wrappers and table primitives, and their relevant feature-level tests.
- Capture a short, safe acceptance matrix for owner/agency, client member, unauthenticated, and unauthorized client; EN/HE, dark/light, desktop/mobile.
- For any library candidate: verify current React 19 + Next.js 16 + TypeScript compatibility, SSR/client boundary, accessibility issues, maintenance cadence, dependency/license constraints, bundle impact, i18n/RTL, and failure behavior.
- Create regression fixtures for multi-tenant queries, proposal creation/editing, request attachments, sorting/filtering, keyboard interaction and onboarding lifecycle before behavior changes.
- Capture real metrics where available (route chunk diff, production build, test count, operation latency); do not set fictional reductions as a pass gate.

**Exit:** baseline report + repeatable test commands + decision matrix for candidate libraries.

### WS-1 — Requests form consolidation (P0)

**Existing:** `components/portal/forms/CreateRequestForm.tsx`, `RequestForm.tsx`, `RequestFormCoreFields.tsx`.

**Proposed:** a shared `requestFormSchema` (locale-aware error message mapping), typed request form values and mapping; `RequestEditorFields` and `RequestAttachmentsField` components; a single submission controller/hook wrapping existing request mutations. Existing entry points remain thin adapters.

- Map create vs edit differences and preserve correct org selection, role/permission rules, initial values, submission/reset behavior, success navigation and attachments.
- Schema and state live in one place where semantics match; domain service stays authoritative.
- Avoid a generic upload abstraction if upload workflows differ significantly.
- Remove old duplicate code only after tests verify both entry points.

**Exit:** same API/user flow for create and edit; one shared validation contract; tested upload error/retry, double submit prevention and correct org scope.

### WS-2 — Proposal editor consolidation (P0; highest business-risk)

**Existing:** `CreatePricingForm.tsx`, `EditPricingForm.tsx`, `components/portal/pricing/ProposalContentEditor.tsx`, `EmbeddedCalculator.tsx`, `lib/domain/proposal-content.ts`, `lib/types/pricing.ts`.

**Proposed:** shared `ProposalForm` + typed `proposalFormSchema` and `toFormValues/fromFormValues` mappers; route-level `CreateProposalContainer` / `EditProposalContainer` remain separate data-loading/save adapters.

- Audit and reconcile schema differences **before** sharing fields; keep create/edit-specific submit actions distinct where needed.
- Respect canonical money units (minor units vs major units), rounding, currency, tax, deposit, hourly/capped estimates, derived totals, signed/approved state and server-side validation.
- No implicit database migration or rewriting historic proposals.
- Preserve linked requests, inclusions/exclusions, requirements, optional payment terms, save draft vs send, collaborator roles and legacy existing records.
- Use field-level composability rather than a gigantic generic config-driven form.

**Exit:** round-trip serialization parity for create/edit; existing proposal domain tests plus explicit VAT/currency/rounding/approval/deposit cases; no mutation of persisted records from merely opening the editor.

### WS-3 — Search and command architecture (P1)

**Existing:** `CommandPalette.tsx`, `GlobalSearch.tsx`, `MobileSearch.tsx`, `PortalShell.tsx`, `lib/utils/permissions.ts`.

**Proposed:** `lib/portal/search/` with typed result descriptors, permission-aware input providers, normalized ranking/filtering and result activation. One shared search interaction layer; separate presentation for inline, modal and mobile *only if UX requires it*.

- Inventory all Ctrl/Cmd+K and Escape handlers; designate exactly one global shortcut owner (PortalShell or a single hook). No competing open/close handlers.
- Use a normalized, permission-aware result model with stable IDs, deterministic ordering and request vs proposal distinctions. Retain `useOpenRequest` semantics.
- Avoid fetching every organization's objects on each keystroke; use existing TanStack Query cache and bounded/authorized fetches; validate server-side access for search datasets and snippets.
- Compare **cmdk** with a small Radix-based combobox using a spike. cmdk is a *candidate*, not an automatic decision: evaluate currently reported ARIA selection issues and full React 19 compatibility.
- Verify keyboard focus, IME composition, Tab, Enter, Escape, Home/End, empty and loading states, disabled options, screen reader announcements and mouse/touch.
- Preserve EN/HE search behavior; case folding and ranking should not accidentally deprioritize Hebrew text.

**Exit:** shared result tests and zero duplicated global hotkey ownership; agency/client authorization and EN/HE interaction tests pass.

### WS-4 — Onboarding tour engine (P1, conditional adoption)

**Existing:** `OnboardingTour.tsx`, `components/portal/shell/PortalShell.tsx`, `lib/services/portal-users.ts`.

**Candidate:** Driver.js (https://driverjs.com/docs/basic-usage) with a minimal client-only wrapper and scoped theme CSS.

- Spike current tour vs Driver.js on mobile/desktop, RTL, dark mode, focus and keyboard, reduced motion, missing/dynamically mounted targets, sidebar collapsed states and scrolling nested containers.
- Preserve completion and skip persistence **exactly once**, including failure state and rerender/unmount cleanup; no accidental repeat tour after completion.
- Keep translations in source locale files; avoid injecting untrusted strings/HTML into tour descriptions.
- Avoid a mandatory new dependency if Driver.js fails acceptance or adds disproportionate complexity.
- Add a user-facing restart flow only as a separately scoped UX enhancement; do not bundle into a behavior-preserving refactor.

**Exit:** equivalent guided steps, clean teardown, stable target positioning across scroll/resize, no keyboard/focus regressions in EN/HE.

### WS-5 — Complex tables without replacing the visual system (P2)

**2026-10-09 current-code update:** RequestsClient now calls §filterAndSortRequests§ in §lib/domain/request-list-filter.ts§. A simple paging bug was found instead and is addressed in PR #40. Do not adopt TanStack Table just for this screen.

**Existing:** `PortalTable.tsx`, `RequestsClient.tsx`, `AgencyPricingClient.tsx`, `PricingListClient.tsx`, `MarketingLeadsClient.tsx`.

**Candidate:** `@tanstack/react-table` for state/row models, retaining PortalTable rendering/CVA.

- Pilot on Requests only; extract pure filters and domain-specific grouping separately from table mechanics.
- Explicitly choose client-side vs server-side sorting/filtering/pagination **consistently**. Never sort just one fetched page while presenting global sorting.
- Preserve selection across filters/pages with stable row IDs, pinned requests, nested/bundled request semantics, and batch-action authorization.
- Only migrate pricing/clients/leads tables when they benefit from multi-column sorting, filtering, pagination, selection or column visibility.
- Keep simple display-only tables as they are.

**Exit:** tested filtering/sorting/page counts, stable selection, deterministic links, responsive layout and RTL headers. No regressions in business-specific grouping.

### WS-6 — Mentions and toast surface (P2)

**MentionInput:** First test accessible Radix/combobox composition while keeping current plain-text persisted format. If caret-anchored popup is essential, evaluate Floating UI (https://floating-ui.com/docs/react) rather than introducing an entire rich text editor. Preserve cursor position, keyboard navigation, space-containing names, duplicate-name resolution, and authorized org-user suggestions. Never serialize display names as trusted identities for notifications; if actual mentions trigger notifications, use stable IDs with a backwards-compatible representation.

**Toasts:** Standardize around Sonner via one small `portalToast` API with typed variants and actions. Audit current `useToast` consumers, translate them, and remove the legacy wrapper only after callers are migrated. Existing custom visual/toast duration semantics require review; the old empty `toasts` property is a compatibility smell, not justification for a breaking immediate deletion.

**Exit:** no duplicated notification public APIs, no toast regressions, and accessible/authorized mention selection.

## 6. Candidate library decision record

| Area | Prefer | Adoption gate | Reject / defer when |
| --- | --- | --- | --- |
| Generic dialog/select/tooltip | Existing Radix + CVA | Current behavior passes accessibility tests | No new library required |
| Command menu | cmdk spike vs existing Radix | React 19, keyboard/ARIA + RTL tests, issue review, bundle budget | Open accessibility regressions or more custom glue than removed |
| Guided tour | Driver.js spike | React integration, focus, mobile, RTL, dynamic DOM + lifecycle reliable | Existing tour is measurably more robust |
| Rich data table | TanStack Table, pinned compatible major | Correct state/row model, tenant scopes, bundle result | Presentational-only table |
| Mentions popup | Existing Radix; Floating UI if needed | Caret geometry, multi-line/scroll, accessible keyboard | Requires full text-editor rewrite |
| Data fetching | Existing TanStack Query | Cache keys and invalidation stay coherent | Additional global server-state library |
| Form state | Existing React Hook Form + Zod | Shared schemas and typed adapters | Second form system |
| User feedback | Existing Sonner | Compatibility/UX verified | Parallel toast implementation |

**Versioning rule:** Review a library's current maintained release **at implementation time**, pin via `pnpm-lock.yaml`, and document the chosen version + rationale in that workstream PR. Do not silently adopt the newest major.

Official research: [cmdk](https://github.com/dip/cmdk), [cmdk selection/ARIA issue](https://github.com/dip/cmdk/issues/413), [Driver.js](https://driverjs.com/docs/configuration), [TanStack Table (current, version-sensitive)](https://tanstack.com/table/latest/docs/framework/react/quick-start), [Floating UI React](https://floating-ui.com/docs/react).

## 7. Atomic PR sequence and dependency graph

All implementation PRs are independent review units targeting `main`, no mass replacement:

| PR | Priority | Scope | Depends on | Definition of Done |
| --- | --- | --- | --- | --- |
| S0 — Baseline & guardrails | P0 | Tests/fixture matrix, metrics, dependency spikes, identify owners of keyboard/notification APIs | None | Executed baseline and CI-compatible checks documented |
| S1 — Request forms | P0 | Share schema, fields and submit controller | S0 | Create/edit parity and upload/org security tests |
| S2 — Proposal forms | P0 | Shared form, mappers and preservation tests | S0 | Currency/tax/payment/request-linked round trips |
| S3 — Search | P1 | Shared data/ranking and one interaction engine; optional cmdk | S0 | No keyboard/permission/RTL regression |
| S4 — Onboarding | P1 | Engine spike, replacement only if pass | S0 | Step/focus/persistence/scroll parity |
| S5 — Tables | P2 | Requests pilot with headless TanStack Table if justified | S0; ideally S3 stable | Selection/sorting/filtering tests pass |
| S6 — Mentions and toast | P2 | Two separate small PRs in practice | S0 | No stale API, authorized suggestions, a11y |
| S7 — Dead-code retirement | P2 | Remove unused wrappers, dead adapters/duplicate helpers documented by usage search | All relevant prior PRs | No unresolved imports; no behavior changes |

S1/S2 can be parallel **only** if their shared domain contracts are independent. S3/S4 likewise can proceed separately. Never combine high-risk commercial changes with unrelated visual refactoring.

**Implementation checklist template for every PR**
- [ ] Explain before/after architecture and existing call sites.
- [ ] Attach evidence that the library actually removes complexity.
- [ ] Add/update unit and integration tests before deleting old code.
- [ ] Verify EN/HE, RTL/LTR, light/dark, mobile/desktop, keyboard and reduced motion as applicable.
- [ ] Verify authorized agency/client scopes, cache invalidation, and no mutation/read leakage.
- [ ] Run required checks; report exact failures without marking unrun tests as passed.
- [ ] Compare baseline metrics (tests, relevant route bundles, import count, component paths).
- [ ] Ensure narrow diff, preview verification and straightforward revert.

## 8. Verification contract

Use the repo's `pnpm` workflow (not a new package manager):

`pnpm install --frozen-lockfile`  
`pnpm run typecheck`  
`pnpm run lint`  
`pnpm run test:run`  
`pnpm run i18n:validate`  
`pnpm run build` (where build secrets/configuration are provisioned; disclose environment blockers).

Run smaller targeted test commands during development. Existing Vitest + React Testing Library are the default. If end-to-end browser coverage is insufficient, propose a minimal separate smoke suite; don't introduce an entire second test framework by default.

### Required regression matrix

| Flow | Agency owner | Client | RTL/EN | Edge cases |
| --- | --- | --- | --- | --- |
| Create/edit request | Org and assignee selection | Own org only | Both | Files, errors, duplicate submission, retry |
| Proposal create/edit/send | Correct pricing + actions | Only authorized visible records | Both | Tax, currency, minor units, rounding, deposit, draft/send, legacy payload |
| Global search/command | Agency permitted objects | No other tenant results | Both | Empty, loading, IME, keyboard, focus, shortcut collision |
| Onboarding | Persistent status | Same completion lifecycle | Both | Missing target, scroll/resize, skip/restart, reduced motion |
| Table | Global sort and batch authorization | Own authorized rows | Both | Selection after paging/filtering, pinned/nested requests |
| Mentions/toasts | Team targets allowed | Org-scoped users only | Both | Duplicate names, paste, focus, stale toast |

Do **not** claim WCAG AA compliance or performance gains from unit tests alone. Record manual keyboard/screen reader checks and real bundle/runtime measurements.

## 9. Deployment, rollout, and rollback

1. Planning RFC merges without changing runtime.
2. Each workstream uses a dedicated branch and focused PR with review/preview checks.
3. Prefer internal-only pilot surfaces or controlled rollout for the search/onboarding/table engines. Add feature flags only where rollback is otherwise risky; avoid permanent configuration debt.
4. During migration, preserve public component exports/adapters temporarily rather than coordinating widespread same-commit changes.
5. For client-visible changes, test production-like data **without** altering real orders, invoices or client records.
6. Revert individual PR or disable the pilot when acceptance fails. Do not deploy a dependency upgrade as a side effect of unrelated refactors.
7. Delete adapters, flags and unused dependencies after verification in a separate cleanup PR.

## 10. Success scorecard (measure, do not assume)

| Metric | Baseline | Success target |
| --- | --- | --- |
| Distinct request form validation/attachment paths | Inventory in S0 | One canonical shared implementation where semantics match |
| Parallel create/edit proposal UI implementations | 2 large route components | One shared editor with separate create/edit orchestration |
| Global Cmd/Ctrl+K shortcut owners | Inspect shell and palette in S0 | Exactly one registered owner |
| Keyboard/navigation logic duplicated across searches | Multiple manual handlers | Shared tested interaction contract |
| Custom tour position/scroll lifecycle | `OnboardingTour.tsx` manual logic | Library-backed implementation **if** spike passes; otherwise documented decision |
| Complex table sort/filter/page logic | Manual in Requests | Reusable tested mechanics where worthwhile |
| Broken customer flows, unauthorized data, RTL regressions | Establish S0 | Zero new known regressions |
| Dependency, bundle and runtime cost | Measure S0 | No unexplained meaningful regression; document tradeoffs |
| Static checks and target tests | Run S0 | All required checks green, or explicit pre-existing failures isolated |

**Success is not measured by line count alone.** Small deletion with high regression risk is worse than a few extra understandable lines.

## 11. Stop/go decisions

Before coding a workstream, answer and document:

1. Are the apparent duplicates really semantically identical? If not, what must stay different?
2. Does the chosen library actually solve the hard parts (accessibility, focus, keyboard, floating placement) better?
3. Is React/Next/SSR + RTL support demonstrated in a small prototype?
4. Can the change land independently and be reverted in one PR?
5. What specific tests catch its most expensive business regression?
6. Does it protect client/org boundaries at both UI and data access layers?

**Current progress:** Read [Static baseline & implementation tracker](PLATFORM_SIMPLIFICATION_BASELINE.md). PRs #36–#41 cover focused parts of S1–S6. Full regression/browser verification and any remaining library evaluation are still required before merging or declaring the roadmap complete. Do not begin with a broad dependency installation or visual replacement.
