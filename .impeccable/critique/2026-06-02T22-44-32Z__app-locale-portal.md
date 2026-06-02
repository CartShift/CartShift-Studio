---
target: portal
total_score: 30
p0_count: 0
p1_count: 0
p2_count: 3
timestamp: 2026-06-02T22-44-32Z
slug: app-locale-portal
---
# Portal Design Critique (Re-run)

Target: `app/[locale]/portal` + `components/portal` (authenticated shell, agency workspace, client workspace, auth)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons, Sonner toasts, workboard drag overlay remain strong |
| 2 | Match System / Real World | 3 | Agency/commerce vocabulary; auth errors human-readable; empty states now i18n |
| 3 | User Control and Freedom | 3 | Skippable onboarding; dashboard secondary panel toggles tips/status |
| 4 | Consistency and Standards | 3 | Portal CSS consolidated; dark sidebar aligns with DESIGN.md |
| 5 | Error Prevention | 3 | Zod + inline validation; destructive confirmations on workboard |
| 6 | Recognition Rather Than Recall | 3 | Visible nav group headings; collapsed rail shows micro-labels + tooltips |
| 7 | Flexibility and Efficiency | 3 | Command palette, bulk workboard actions, keyboard nav in tour |
| 8 | Aesthetic and Minimalist Design | 3 | Dashboard front-load reduced; empty states flattened; page fade-ins remain on 9 routes |
| 9 | Error Recovery | 3 | Dashboard retry; Firebase auth mapped to plain copy |
| 10 | Help and Documentation | 3 | Persistent sidebar Help link; onboarding spotlights `data-tour` targets |
| **Total** | | **30/40** | **Good — prior P1 navigation/i18n issues resolved; polish pass still worthwhile** |

## Anti-Patterns Verdict

**LLM assessment:** Still reads as a purpose-built agency OS, not generic AI slop. Residual tells: rainbow onboarding step icons, uniform `animate-in fade-in duration-500` on many portal clients, and gradient CTA on login (on-brand, not slop).

**Deterministic scan:** `detect.mjs` on `app/[locale]/portal` + `components/portal` returned **0 findings** (exit 0).

**Browser visualization:** Inspected `http://localhost:3000/en/portal/login` at 1440×900 and 390×844. Authenticated dashboard/sidebar could not be verified without session. Detect overlay injection was not run in-page (browser MCP has no script-eval hook); CLI scan is the deterministic layer.

## Overall Impression

The fix pass landed. Navigation IA, dashboard density, empty-state noise, CSS duplication, and i18n gaps from the prior critique are materially addressed. The portal now sits in the **Good** band (28–35). The remaining gap is **polish and verification** — especially collapsed-label readability, in-app help depth, and stripping redundant route-level fade-ins — not structural UX failure.

## What's Working

1. **Navigation recall improved.** Expanded sidebar shows translated group headings (`portal-nav-section-title`); collapsed rail shows icon + 9px label + tooltip backup (`SidebarNavigation.tsx`).
2. **Client dashboard prioritizes work.** Greeting → Pinned Requests → Quick Actions → Activity; tips and service status sit behind a collapsible secondary panel with localStorage persistence.
3. **Help is discoverable.** Sidebar footer exposes Help & support with RTL-safe placement and collapsed tooltips (`SidebarFooter.tsx` → `/contact`).

## Priority Issues

### [P2] Uniform page fade-in on most portal routes
- **Why it matters:** Nine clients still mount with `animate-in fade-in duration-500`, adding sameness without communicating state.
- **Fix:** Remove the wrapper or reserve motion for first-visit / route-transition only.
- **Suggested command:** `/impeccable quieter portal route transitions`

### [P2] Help exits the portal context
- **Why it matters:** Sidebar Help links to `/contact`, a marketing surface — users lose shell, nav, and task context when seeking docs.
- **Fix:** In-portal help drawer, contextual docs, or `/portal/help` with search scoped to role.
- **Suggested command:** `/impeccable document portal help`

### [P2] Collapsed nav micro-labels at 9px
- **Why it matters:** Labels exist (fixing prior icon-only P1), but 9px truncated text may fail readability at 200% zoom and for low-vision users.
- **Fix:** Bump to 10–11px with line-clamp, or show labels on focus-within without relying on tooltip hover.
- **Suggested command:** `/impeccable harden portal sidebar`

## Persona Red Flags

**Alex (Power User):** Command palette and bulk workboard still strong. Friction: no in-UI shortcut legend beyond Cmd+K; mobile workboard still tab-switches columns.

**Jordan (First-Timer):** Login remains clear. Improved: group labels, help link, anchored onboarding tour. Remaining: agency expanded nav is still long (now chunked, not shortened).

**Sam (Accessibility):** Auth inputs labeled; show-password exposed. Red flags: 9px collapsed nav labels; help link opens external page (context loss for screen reader landmark continuity).

**Agency Operator (project-specific):** Dark sidebar + grouped nav reduces scan cost. Collapsed rail still omits group headings — only icons/short labels — so context switching between Operations vs Growth clusters still requires recall.

## Minor Observations

- Onboarding tour retains multi-color decorative icons despite spotlight anchors — minor AI tell.
- `TipsCard` may still carry primary tint on dashboard when secondary panel is expanded.
- Authenticated surfaces (dashboard order, agency group headings, tour spotlights) need a logged-in browser pass to fully validate.

## Questions to Consider

- Should Help open an in-shell panel instead of leaving the portal?
- What if collapsed sidebar showed group initials (e.g. "Ops", "Grow") between clusters?
- Would removing all route-level fade-ins make the shell feel faster for Alex without losing delight?
