# Platform Simplification — Static baseline & implementation tracker

**Inspected:** 2026-10-09  
**Source snapshot:** `main` @ `f5b1570d59581cfec9c23b8fd9d89aa5b3bf3c40`  
**Method:** GitHub tree/source inspection + GitHub Actions PR check results. **No local `pnpm` build, full test suite or visual browser run was executed here.**

## Static inventory

| Signal | Observed |
| --- | ---: |
| Repository tracked blobs | 1,357 |
| Source JS/TS/TSX/JSX files | 825 |
| Test/spec files (JS/TS/JSX/TSX) | 71 |
| Shared `components/ui` files | 44 |
| `CreateRequestForm.tsx` | 13,743 bytes |
| `RequestForm.tsx` | 17,154 bytes |
| `CreatePricingForm.tsx` | 35,271 bytes |
| `EditPricingForm.tsx` | 33,948 bytes |
| `CommandPalette.tsx` | 13,095 bytes |
| `GlobalSearch.tsx` | 9,096 bytes |
| `OnboardingTour.tsx` | 12,926 bytes |
| `MentionInput.tsx` | 6,328 bytes |
| `RequestsClient.tsx` | 48,570 bytes |
| `PricingListClient.tsx` | 24,239 bytes |

Repository changes continued while this work was underway; this baseline is deliberately bound to one SHA. File size is not a proxy for user-perceived performance.

## Existing continuous integration

`.github/workflows/ci.yml` runs **changed-file ESLint** and **Vitest affected tests** for pull requests. It does **not** run typecheck or the full test/build suite for every PR. The workflow's `full` job is gated by `workflow_dispatch` and runs `pnpm lint`, `pnpm test:run`, and `pnpm build` under CI environment stubs. The two other workflows cover Firestore rules and Firebase Functions changes.

A green `quality` check **must not** be described as proof of successful full typecheck, full suite, production build, end-to-end, multi-tenant security or RTL browser QA.

## Incremental implementation PRs

| PR | Scope | Merge prerequisite |
| --- | --- | --- |
| [#36](https://github.com/CartShift/CartShift-Studio/pull/36) | Request form schema and adapter consolidation | Confirm CreateRequestForm imports/flows, full typecheck and new tests |
| [#37](https://github.com/CartShift/CartShift-Studio/pull/37) | Single Cmd/Ctrl+K shortcut and shared keyboard list navigation | Verify keyboard focus and screen reader / EN-HE search |
| [#38](https://github.com/CartShift/CartShift-Studio/pull/38) | Common proposal validation field schema | Proposal create/edit persisted payload parity, money calculations and full typecheck |
| [#39](https://github.com/CartShift/CartShift-Studio/pull/39) | Onboarding geometry, focus, RTL, scroll | Browser tour steps in narrow viewport, focus and persistence |
| [#40](https://github.com/CartShift/CartShift-Studio/pull/40) | Restore requests pagination; shared bounded paginator | Render 9+ requests in both agency/client views, EN/HE |
| [#41](https://github.com/CartShift/CartShift-Studio/pull/41) | Mention parser boundaries | Editor keyboard, cursor and emails in realistic textarea |

**Do not merge all six at once.** Each PR is independently revertible. Prefer order #36, #38, #37, #41, #40, #39 after its required gates are satisfied and prior merged main is synced.

## Decisions from current code

- Current `RequestsClient` already extracts `filterAndSortRequests` into `lib/domain/request-list-filter`. Table adoption is **not justified for this screen solely for filtering**. A focused pagination bug fix provides clearer value with no dependency.
- At the time of inspection TanStack Table latest documentation presents v9 APIs and differs from v8 (`useTable` versus `useReactTable`). No dependency or lockfile change should happen until a concrete headless-table pilot is version-pinned and typed.
- Radix dialog/select primitives are already used. A second UI kit is unnecessary.
- The onboarding tour currently depends on carefully coupled client lifecycle and i18n; Driver.js integration must earn adoption via browser/focus tests, not by reputation.
- The portal has both Sonner-based `portalToast` and a legacy `useToast` custom wrapper. A full unification is deferred until UI parity and proper toast theming are verified; do not replace a working branded toast with an unstyled one merely to remove code.
- The full proposal editor has coupled UI, currency and commercial workflow. The common validation extraction is a safe precursor; a shared renderer requires tests and a narrower design review.

## Integrated implementation and library decisions

Integration PR [#42](https://github.com/CartShift/CartShift-Studio/pull/42) combines #36–#41 into an independently testable branch and extends the initial work with:

- A **shared proposal line-items and totals editor** for creation and editing, while keeping persistence, taxes, deposits and lifecycle rules in their existing containers.
- Shared search request classification and explicit role checks instead of defaulting a missing agency role to owner.
- One branded Sonner notification emitter shared by portal helpers and legacy hook callers.
- Focused parser, pagination, role-filter and editor interaction tests, including LTR/RTL behavior.
- A **temporary integration-only full verification workflow**, to be removed before merge.

**Dependency decision:** Keep Radix, TanStack Query, React Hook Form, Zod and Sonner. The audited source did not justify another UI kit or global state library. cmdk, Driver.js, TanStack Table and Floating UI remain deferred until a measured focused spike proves a maintenance/accessibility advantage. No new runtime dependencies were needed.

**CI note:** A green per-PR quality check is not full verification. Use the last commit of #42 for complete lint, TypeScript, Vitest, translation and build status.

## Remaining gates before claiming "complete"

- [ ] Execute `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test:run`, `pnpm i18n:validate`, and `pnpm build` on an up-to-date main + integration branch (with safe CI env); capture exact output.
- [ ] Confirm Browser QA in EN/HE, mobile/desktop, dark/light and reduced motion for all changed flows.
- [ ] Verify agency, client and cross-tenant data isolation on an authorized staging/fixture dataset.
- [ ] Check proposal money, tax, deposit and send/publish lifecycle against immutable fixtures.
- [ ] Run one combined integration branch with all validated PRs and check conflicts/resolutions before sequential merging.
- [ ] Decide if any additional library adoption actually reduces complexity and passes the documented gate; update the RFC decision record.
- [ ] Remove retired adapters only after code-search / build confirms no consumers.
