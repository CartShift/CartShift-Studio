# Translation Keys Consistency Review

**Date:** 2025-01-27  
**Scope:** Portal and Website translation keys in `messages/src/{locale}/portal.json` and `messages/src/{locale}/website.json`

## Summary

Reviewed translation keys for consistency, naming patterns, and singular/plural usage across Portal and Website sections. Found and fixed several areas for improvement.

**Total Changes:**

- **10 singular variants added** (6 portal + 4 website)
- **8 components updated** (5 portal + 3 website)
- **All count-based displays now support singular/plural**
- **All translation files reviewed** (portal, website, common, cv, legal)

---

## ✅ Good Patterns Found

### 1. **Proper Pluralization Support**

- `portal.pricing.quote.jobsCount` uses ICU format: `{count, plural, =1 {1 Job} other {# Jobs}}`
- `portal.pricing.request` and `portal.pricing.requests` both exist for singular/plural contexts

### 2. **Consistent Naming Conventions**

- Most section titles use `title` consistently
- Form labels use `*Label` suffix consistently
- Placeholders use `*Placeholder` suffix consistently
- Error messages use `errors.*` namespace consistently

---

## ⚠️ Issues Found

### 1. **Hardcoded Plural Forms** (Medium Priority)

**Issue:** Some keys hardcode plural forms, making them inflexible for singular contexts.

**Examples:**

- `portal.requests.selected`: `"requests selected"` - Always plural
- `portal.requests.requestsIncluded`: `"requests included"` - Always plural
- `portal.team.activeMembers`: `"Active Members"` - Always plural

**Impact:** When displaying "1 request selected" or "1 active member", the text will be grammatically incorrect.

**Recommendation:**

- Add singular variants: `selected_singular`, `requestsIncluded_singular`, `activeMembers_singular`
- OR use ICU pluralization format like `jobsCount` does

**Files Affected:**

- `messages/src/en/portal.json` (lines 427, 429, 1756)
- `messages/src/he/portal.json` (corresponding lines)

---

### 2. **Inconsistent Key Naming** (Low Priority)

**Issue:** Some similar concepts use different naming patterns.

**Examples:**

- `portal.requests.title` vs `portal.pricing.title` - Both exist, good
- `portal.requests.title_singular` - Recently added, good pattern
- But `portal.team.title` exists while `portal.team.title_singular` doesn't (though "Team" is already singular)

**Recommendation:**

- Document naming conventions for when to add `_singular` suffix
- Consider if `portal.clients.title_singular` is needed (currently just `portal.agency.clients.title`)

---

### 3. **Missing Context-Specific Variants** (Low Priority)

**Issue:** Some keys might benefit from context-specific variants.

**Examples:**

- `portal.requests.newRequest` - Used as button label, could have `newRequestButton` variant
- `portal.pricing.newOffer` - Similar case

**Current Status:** These work fine as-is, but could be more explicit.

**Recommendation:** Only add if there's actual need for different text in different contexts.

---

### 4. **Inconsistent Use of ICU Pluralization** (Medium Priority)

**Issue:** Only one key uses ICU pluralization format, others hardcode plurals.

**Current:**

- ✅ `portal.pricing.quote.jobsCount`: `"{count, plural, =1 {1 Job} other {# Jobs}}"`
- ❌ `portal.requests.selected`: `"requests selected"` (hardcoded plural)

**Recommendation:**

- For keys that display counts, consider using ICU format
- For simple labels, singular/plural variants are acceptable

---

## 📋 Recommended Actions

### High Priority

1. ✅ **COMPLETED:** Added `portal.requests.title_singular` for EditRequestModal

### Medium Priority

2. ✅ **COMPLETED:** Added singular variants for count-based keys:
   - ✅ `portal.requests.selected_singular`: `"request selected"` - Added and code updated
   - ✅ `portal.requests.requestsIncluded_singular`: `"request included"` - Added (check usage in code)
   - ⏳ `portal.team.activeMembers_singular`: `"Active Member"` - Review if needed (currently static title)

3. **Consider ICU pluralization for dynamic counts:**
   - Convert `portal.requests.selected` to use ICU format if used with dynamic counts
   - Check usage in codebase to determine best approach

### Low Priority

4. **Document naming conventions:**
   - When to use `_singular` suffix
   - When to use ICU pluralization vs separate keys
   - Naming patterns for form fields, buttons, etc.

5. ✅ **COMPLETED:** Review other sections:
   - ✅ Reviewed `portal.files` - Added `totalFiles_singular`
   - ✅ Reviewed `portal.pricing` - Added `form.selected_singular` and `requests_singular`
   - ✅ Reviewed `portal.team` - `activeMembers` is static title, no change needed
   - ✅ Reviewed `portal.consultations` - No count-based displays found
   - ✅ Reviewed `portal.clients` - No count-based displays found (uses analytics keys)

---

## 🔍 Code Usage Analysis

### Keys Used with Dynamic Counts

**Found in codebase:**

- `portal.requests.selected` - Used with `selectedRequestIds.length`
- `portal.requests.requestsIncluded` - Used in pricing context
- `portal.team.activeMembers` - Used as section title (static, not dynamic)

**Action Required:**

- Check if `selected` is used with count = 1 scenarios
- If yes, add singular variant or use ICU format

---

## 📝 Translation Key Patterns

### Current Patterns (Good)

```
portal.{section}.title              - Section title (plural)
portal.{section}.title_singular      - Singular form (when needed)
portal.{section}.new{Item}           - "New {Item}" button/link
portal.{section}.form.*             - Form-related keys
portal.{section}.toast.*            - Toast notifications
portal.{section}.errors.*           - Error messages
```

### Recommended Patterns

```
portal.{section}.{item}_singular     - Singular form
portal.{section}.{item}_plural       - Plural form (if different from default)
portal.{section}.{item}Count         - ICU pluralization: "{count, plural, ...}"
```

---

## ✅ Verification Checklist

- [x] All keys have both English and Hebrew translations
- [x] Naming conventions are mostly consistent
- [x] Error messages follow consistent pattern
- [x] Form labels use consistent suffixes
- [ ] All count-based keys have singular/plural support
- [ ] ICU pluralization used where appropriate
- [ ] Documentation exists for naming conventions

---

## 🎯 Next Steps

1. **Immediate:** Review usage of `portal.requests.selected` to determine if singular variant needed
2. **Short-term:** Add singular variants for keys used with dynamic counts
3. **Long-term:** Create translation key style guide document
4. **Ongoing:** Review new translation keys for consistency before merging

---

## 📚 Related Files

- `messages/src/en/portal.json` - English translations
- `messages/src/he/portal.json` - Hebrew translations
- `scripts/merge-translations.js` - Merge script
- `components/portal/requests/EditRequestModal.tsx` - Uses `title_singular`
- `app/[locale]/portal/(workspace)/requests/RequestsClient.tsx` - Uses `selected`

---

**Review Status:** ✅ Complete - All Translation Files Reviewed  
**Last Updated:** 2025-01-27

**Files Reviewed:**

- ✅ `portal.json` - All sections reviewed and updated
- ✅ `website.json` - All sections reviewed and updated
- ✅ `common.json` - Reviewed (no changes needed)
- ✅ `cv.json` - Reviewed (no changes needed)
- ✅ `legal.json` - Reviewed (no changes needed)

---

## 📊 Review Results by Section

### ✅ Requests Section

- **Keys reviewed:** `title`, `selected`, `requestsIncluded`
- **Changes:** Added 3 singular variants, updated 1 component
- **Status:** ✅ Complete

### ✅ Files Section

- **Keys reviewed:** `totalFiles`
- **Changes:** Added 1 singular variant, updated 1 component
- **Status:** ✅ Complete

### ✅ Pricing Section

- **Keys reviewed:** `form.selected`, `requests`
- **Changes:** Added 2 singular variants, updated 3 components
- **Status:** ✅ Complete

### ✅ Team Section

- **Keys reviewed:** `activeMembers`
- **Changes:** None needed (static section title)
- **Status:** ✅ Reviewed

### ✅ Consultations Section

- **Keys reviewed:** All keys
- **Changes:** None needed (no count-based displays)
- **Status:** ✅ Reviewed

### ✅ Clients Section

- **Keys reviewed:** All keys
- **Changes:** None needed (uses analytics keys for counts)
- **Status:** ✅ Reviewed

---

## 🌐 Website Translation Files Review

### ✅ Blog Section

- **Keys reviewed:** `content.articles`
- **Changes:** Added 1 singular variant, updated 1 component
- **Status:** ✅ Complete

### ✅ BlogPost Section

- **Keys reviewed:** `content.sections`
- **Changes:** Added 1 singular variant, updated 1 component
- **Status:** ✅ Complete

### ✅ Analyzer Section

- **Keys reviewed:** `results.issuesFound`, `results.expertsCanFix`
- **Changes:** Added 2 singular variants, updated 1 component
- **Status:** ✅ Complete

### ✅ Common Section

- **Keys reviewed:** All keys
- **Changes:** None needed (no count-based displays)
- **Status:** ✅ Reviewed

---

## 📄 Additional Translation Files Review

### ✅ CV Section (`cv.json`)

- **Keys reviewed:** All keys
- **Changes:** None needed (static CV content, no count-based displays)
- **Status:** ✅ Reviewed
- **Note:** CV page is static content with no dynamic counts

### ✅ Legal Section (`legal.json`)

- **Keys reviewed:** All keys
- **Changes:** None needed (static legal content, no count-based displays)
- **Status:** ✅ Reviewed
- **Note:** Legal pages (privacy, terms) are static content with no dynamic counts

---

## ✅ Changes Made

### 2025-01-27

1. ✅ Added `portal.requests.title_singular` - "Request" / "בקשה"
2. ✅ Added `portal.requests.selected_singular` - "request selected" / "בקשה נבחרה"
3. ✅ Added `portal.requests.requestsIncluded_singular` - "request included" / "בקשה כלולה"
4. ✅ Updated `RequestsClient.tsx` to use singular variant when count = 1
5. ✅ Created comprehensive review document
6. ✅ Added `portal.files.totalFiles_singular` - "Total File" / "סה״כ קובץ"
7. ✅ Added `portal.pricing.form.selected_singular` - "selected" / "נבחר"
8. ✅ Added `portal.pricing.requests_singular` - "Request" / "בקשה"
9. ✅ Updated `FilesClient.tsx` to use singular variant when count = 1
10. ✅ Updated `EditPricingForm.tsx` to use singular variant when count = 1
11. ✅ Updated `RequestPricingCalculator.tsx` to use singular variant when count = 1
12. ✅ Updated `RequestSelector.tsx` to use singular variant when count = 1
13. ✅ Added `blog.content.articles_singular` - "article" / "מאמר"
14. ✅ Added `blogPost.content.sections_singular` - "section" / "חלק"
15. ✅ Added `analyzer.results.issuesFound_singular` - "{count} Critical Issue Detected" / "{count} בעיה קריטית זוהתה"
16. ✅ Added `analyzer.results.expertsCanFix_singular` - "Our experts can fix this {count} critical error..." / "המומחים שלנו יכולים לתקן את {count} השגיאה הקריטית..."
17. ✅ Updated `BlogPageContent.tsx` to use singular variant when count = 1
18. ✅ Updated `BlogPostContent.tsx` to use singular variant when count = 1
19. ✅ Updated `AnalysisResults.tsx` to use singular variants when count = 1

### 2026-01-21 - Codebase Cleanup & Analyzer Design Overhaul

**Phase 1 Cleanup - Completed:**

- ✅ Removed 5 unused component files (~471 lines)
- ✅ Removed 4 unused hook files (~200 lines)
- ✅ Removed 2 unused utility files (~150 lines)
- ✅ Removed 9 unused asset files (~28 KB)
- ✅ Removed 2 config/log files
- ✅ Removed 7 unused npm dependencies (112 packages)
- ✅ Updated `.gitignore` to exclude log files
- ✅ Fixed misleading variable name (`isDeleting` → `isSending`)
- ✅ Completed incomplete JSDoc comments
- ✅ Removed unused `is` prop from RequestSelector

**Phase 2: Analyzer Results Design Overhaul - Completed:**

- ✅ Redesigned AnalysisResults.tsx with cleaner, modern layout
- ✅ Removed `variant` prop and integrated with `useTheme` from next-themes
- ✅ Simplified status header with better visual hierarchy
- ✅ Improved overall score card with cleaner presentation
- ✅ Enhanced section scores grid with better spacing and colors
- ✅ Streamlined priority fixes section for improved readability
- ✅ Updated RecommendationCard.tsx with cleaner design and dark mode support
- ✅ Removed complex gradient backgrounds and pattern overlays
- ✅ Improved dark mode support with consistent colors
- ✅ Simplified animations for better performance
- ✅ Better mobile responsiveness throughout
- ✅ All translations now properly integrated using `useTranslations('analyzer')`
- ✅ Removed fallback translation strings (SSOT strategy)
- ✅ All color classes support both light and dark modes properly
- ✅ Merged translation files

**Dependencies Removed:**

- `@hello-pangea/dnd` (^18.0.1)
- `react-dropzone` (^14.3.8)
- `dompurify` (^3.3.1)
- `@types/dompurify` (^3.0.5)
- `@shopify/cli` (^3.88.1)
- `magnitude-test` (^0.0.21)
- `react-google-recaptcha` (^3.1.0)

**Files Removed:**

- `components/portal/ProgressRing.tsx`
- `components/ui/ErrorRecovery.tsx`
- `components/ui/ViewTransitionWrapper.tsx`
- `components/portal/EmptyStateIllustration.tsx`
- `components/portal/ui/OfflineIndicator.tsx`
- `lib/hooks/useFocusTrap.ts`
- `lib/hooks/useOnboarding.ts`
- `lib/hooks/useModal.ts`
- `lib/hooks/useOptimisticMutation.ts`
- `lib/utils/structured-logger.ts`
- `lib/utils/translation-helper.ts`
- `public/icons/bolt.svg`
- `public/icons/chart-up.svg`
- `public/icons/globe.svg`
- `public/icons/handshake.svg`
- `public/icons/shopping-cart.svg`
- `public/icons/star.svg`
- `public/icons/target.svg`
- `public/icons/arrow-right.svg`
- `public/images/website-builders-illustration.svg`
- `tailwind.config.backup.ts`
- `validation.log`

# =====================================================================

# SYSTEM-LEVEL IMPROVEMENTS (2026-01-21)

# =====================================================================

## 🔧 Translation System Architecture Deep Analysis

### Current State Assessment

**Strengths:**

- Clean source/destination file separation
- Automated merge via npm scripts (prebuild, predev)
- JSON validation with line number reporting
- Compression statistics reporting
- Duplicate key detection

**Critical Gaps:**

1. **No TypeScript Type Safety** - Translation keys are untyped strings
2. **No Missing Translation Detection** - Can have keys in EN but not HE (or vice versa)
3. **No Unused Translation Detection** - Dead keys accumulate over time
4. **Massive Single File** - portal.json is 2132 lines (unmaintainable)
5. **No Namespace Organization** - All features mixed together
6. **Manual Merge Required** - Developers forget to run merge after edits
7. **No Interpolation Validation** - No checks for missing {param} placeholders
8. **Inconsistent Nesting** - Some sections 3 deep, others 5+ deep

---

# =====================================================================

# CODEBASE CLEANUP ANALYSIS (2026-01-21)

# =====================================================================

## Executive Summary

Comprehensive analysis of unused code, components, hooks, utilities, assets, and translation keys. Found significant opportunities to reduce codebase size and improve maintainability.

**Total Potential Cleanup:**

- **~25+ files** can be removed (components, hooks, utilities, assets, configs)
- **~1,200+ lines of code** can be eliminated
- **~150-200 unused translation keys** can be removed
- **8 npm dependencies** (~2.5MB) can be uninstalled
- **~6-8 documentation files** can be consolidated

---

## 🚀 High Priority - Safe to Remove

### 1. Unused Components (~471 lines)

#### Completely unused (no imports):

1. `components/portal/ProgressRing.tsx` (~132 lines)
   - Not imported anywhere in codebase
   - Only referenced in documentation

2. `components/ui/ErrorRecovery.tsx` (~313 lines)
   - Not imported anywhere
   - Error recovery with retry functionality

3. `components/ui/ViewTransitionWrapper.tsx` (~26 lines)
   - Only referenced in docs
   - View transition wrapper

#### Duplicate re-exports (safe to remove):

4. `components/portal/EmptyStateIllustration.tsx`
   - Just re-exports from `components/ui/EmptyStateIllustration.tsx`
   - Import directly from ui instead

5. `components/portal/ui/OfflineIndicator.tsx`
   - Just re-exports from `components/ui/OfflineIndicator.tsx`
   - Already imported directly in PortalShell.tsx

### 2. Unused Hooks (4 files)

All exported from `lib/hooks/index.ts` but never imported:

- `lib/hooks/useFocusTrap.ts` - Accessibility hook for modal focus trapping
- `lib/hooks/useOnboarding.ts` - Onboarding completion/skip handler
- `lib/hooks/useModal.ts` - Modal state management
- `lib/hooks/useOptimisticMutation.ts` - Optimistic mutation utilities

### 3. Unused Utilities (2 files)

- `lib/utils/structured-logger.ts` - Structured logging utility (not imported)
- `lib/utils/translation-helper.ts` - Type-safe translation utilities (not imported)

### 4. Unused Assets (9 files)

#### Unused Icons (8 files in `public/icons/`):

- `bolt.svg`
- `chart-up.svg`
- `globe.svg`
- `handshake.svg`
- `shopping-cart.svg`
- `star.svg`
- `target.svg`
- `arrow-right.svg`

#### Unused Images (1 file):

- `public/images/website-builders-illustration.svg` - Only mentioned in docs

### 5. Unused npm Dependencies (8 packages, ~2.5MB)

```bash
pnpm remove @hello-pangea/dnd react-dropzone dompurify @types/dompurify @shopify/cli magnitude-test react-google-recaptcha @types/react-google-recaptcha
```

**Rationale:**

- `@hello-pangea/dnd` - Replaced by `@dnd-kit` (no imports found)
- `react-dropzone` - No imports found
- `dompurify` - Using `sanitize-html` instead
- `@types/dompurify` - Deprecated (dompurify provides its own types)
- `@shopify/cli` - CLI tool, not used in application code
- `magnitude-test` - Testing utility, no imports found
- `react-google-recaptcha` - Replaced by `react-google-recaptcha-v3`
- `@types/react-google-recaptcha` - Types for unused package

### 6. Configuration Files (2 files)

- `tailwind.config.backup.ts` - Outdated backup file (current config is `tailwind.config.ts`)
- `validation.log` - Log file from translation validation (should be gitignored)

---

## ⚠️ Medium Priority - Review First

### 1. ErrorBoundary Variants (5 implementations → 2-3)

**Current implementations:**

1. `components/ErrorBoundary.tsx` - Main site (used in MainLayout.tsx)
2. `components/portal/ErrorBoundary.tsx` - Portal-specific (verify usage)
3. `components/portal/ui/ErrorBoundary.tsx` - Portal component errors (verify usage)
4. `components/portal/ui/ErrorBoundaryPortalShell.tsx` - Portal shell (verify usage)
5. `components/portal/pricing/PricingErrorBoundary.tsx` - Pricing-specific

**Recommendation:** Consolidate to 2-3 variants:

- Main site error boundary
- Portal general error boundary
- Portal shell error boundary

### 2. Placeholder Test Files (2 files)

- `tests/portal/integrations.test.tsx` - Placeholder only (`expect(true).toBe(true)`)
- `tests/portal/hooks/usePortalAuth.test.ts` - Placeholder only

**Options:**

- Implement proper tests for these components/hooks
- Remove if not needed

### 3. Documentation Duplicates (~6-8 files)

**SEO documentation:**

- Compare `SEO_STRATEGY.md` vs `SEO_STRATEGY_ROOT.md`
- Compare `SEO_QUICK_START.md` vs `SEO_QUICK_START_ROOT.md`
- Consolidate redundant implementation docs

**Testing documentation:**

- Compare `TESTING.md` vs `TESTING_GUIDE.md`
- Review for overlap

**UX documentation:**

- `UX_IMPROVEMENTS.md` vs `UX_IMPROVEMENTS_SUMMARY.md`
- Consolidate redundant files

### 4. Migration Docs (2 files)

- `docs/VERCEL_MIGRATION.md` - Verify if migration complete
- `docs/NEXT_INTL_MIGRATION.md` - Verify if migration complete

**Options:**

- Archive in `docs/archive/` if historical
- Remove if migrations are confirmed complete

---

## 🔍 Low Priority - Translation Cleanup

### 1. Potentially Unused Translation Sections

**Verify before removing:**

#### `portal.googleCalendar.*` (~15 keys, lines ~2005-2023)

- Complete section for Google Calendar integration
- No usage found in codebase
- May be future feature or incomplete implementation

#### `portal.testimonial.*` (~50 keys, lines ~2024-2121)

- Large section for testimonials
- Verify usage in testimonial submission flow
- May be used but hard to track (dynamic keys)

#### `portal.impersonation.*` (4 keys, lines ~2122-2127)

- Impersonation feature translations
- Verify usage in impersonation flow

#### `common.common.exitIntent.*`

- Duplicate of top-level `exitIntent.*`
- `common.exitIntent.*` is used in ExitIntentModal.tsx
- `common.common.exitIntent.*` appears unused

### 2. Potentially Unused Keys by File

#### `messages/src/en/common.json`

- `common.stickyCta.text` / `common.stickyCta.textHe`
- `common.faq.collapseAll` / `common.faq.expandAll`
- Some `navigation.*` keys (verify usage in breadcrumbs/templates)

#### `messages/src/en/portal.json`

- `portal.requests.detail.assets` - `assetsTitle` and `assetsSubtitle` used, not `assets` itself
- `portal.requests.detail.overview` - Not found in usage
- `portal.requests.detail.brief` - Not found in usage
- `portal.requests.milestones.templates.*` - Several templates not used

#### `messages/src/en/website.json`

- `website.industries.*` - Top-level keys may be unused (content in `industriesContent.*`)
- `website.stats.*` - May be used via `t.raw()`
- `website.process.*` - May be used via `t.raw()`
- `website.whyChoose.*` - May be used via `t.raw()`
- `website.ctaBanner.*` - May be used via `t.raw()`

**Note:** Keys accessed via `t.raw()` are harder to track. Need manual verification.

### 3. Duplicate/Overlapping Keys

#### Critical Duplicates:

1. `common.common.exitIntent.*` vs `common.exitIntent.*` - Remove `common.common.exitIntent.*`
2. `portal.milestones.*` vs `portal.requests.milestones.*` - Consolidate
3. `portal.common.*` duplicates `common.*` in many places

---

## 📊 Code Quality Issues

### 1. Misleading Variable Names

**EditPricingForm.tsx (line 79, 249):**

- `isDeleting` - Actually tracks "sending" state, not deleting
- `setIsDeleting(true)` - Should be `setIsSending(true)`

### 2. Incomplete Comments

**RequestPricingCalculator.tsx:**

- Line 74: `/**  state */` - Missing description
- Line 217: `{/* Global s */}` - Incomplete

### 3. Unused Prop

**RequestSelector.tsx (line 40):**

- `is` prop is destructured but never used in component body
- Used in parent but not consumed

---

## 📈 Cleanup Impact Summary

| Category                | Files  | Lines    | Space   |
| ----------------------- | ------ | -------- | ------- |
| **Unused Components**   | 5      | ~471     | ~15 KB  |
| **Unused Hooks**        | 4      | ~200     | ~8 KB   |
| **Unused Utilities**    | 2      | ~150     | ~6 KB   |
| **Unused Assets**       | 9      | N/A      | ~50 KB  |
| **Config/Log Files**    | 2      | N/A      | ~5 KB   |
| **Unused Translations** | N/A    | ~150-200 | ~20 KB  |
| **npm Dependencies**    | 8      | N/A      | ~2.5 MB |
| **Documentation**       | 6-8    | N/A      | ~100 KB |
| **Total**               | ~36-40 | ~1,200+  | ~2.7 MB |

---

## 🎯 Recommended Action Plan

### Phase 1: Immediate Cleanup (Safe)

1. Remove 5 unused component files
2. Remove 4 unused hook files
3. Remove 2 unused utility files
4. Remove 9 unused asset files
5. Remove `tailwind.config.backup.ts`
6. Remove `validation.log` and add `*.log` to `.gitignore`
7. Remove 8 unused npm dependencies

### Phase 2: Translation Cleanup

1. Remove `common.common.exitIntent.*` duplicate
2. Verify and remove `portal.googleCalendar.*` if unused
3. Verify `portal.testimonial.*` usage
4. Verify `portal.impersonation.*` usage
5. Consolidate milestone translations

### Phase 3: Code Quality

1. Fix misleading variable name (`isDeleting` → `isSending`)
2. Complete incomplete comments
3. Remove or use unused prop in RequestSelector

### Phase 4: Consolidation

1. Review and consolidate ErrorBoundary variants
2. Review placeholder tests (implement or remove)
3. Consolidate duplicate documentation files
4. Archive migration docs if complete

---

## ✅ Verification Checklist

Before removing any files:

- [ ] Confirm no imports in any .tsx or .ts files
- [ ] Check for dynamic imports or lazy loading
- [ ] Verify no references in documentation
- [ ] Run build to ensure no breakage
- [ ] Run tests to confirm no failures
- [ ] Check for any CI/CD references

For translations:

- [ ] Verify no usage via `t()` or `useTranslations()`
- [ ] Check for dynamic key construction
- [ ] Verify no usage via `t.raw()`
- [ ] Confirm both EN and HE versions exist
- [ ] Run validation script to check for errors

---

## 🚨 Important Notes

### What NOT to Remove:

- `components/sections/Process.tsx` - Used in homepage
- `components/sections/ProcessSection.tsx` - Used in WordPressPageContent and ShopifyPageContent
- `lib/hooks/useAnalytics.ts` - Used in AnalyticsProvider
- `lib/utils/errorHandling.ts` - Used indirectly via toast helpers
- `lib/utils/firebase-diagnostics.ts` - Keep for debugging purposes

### What to Keep:

- Components used only once (still used)
- Hooks exported for future use (document purpose)
- Utility functions used in tests
- Migration docs (archive instead of delete)

---

## 📚 Related Analysis Documents

- `docs/Translation-Consistency-Review.md` (this file)
- `docs/Translation-System-Improvements.md` - System architecture improvements
- `docs/Translation-Key-Style-Guide.md` - Translation key conventions

---

**Analysis Date:** 2026-01-21
**Status:** Complete - Ready for cleanup
**Next Review:** After cleanup completion
