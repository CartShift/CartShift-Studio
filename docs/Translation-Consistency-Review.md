# Translation Keys Consistency Review

**Date:** 2025-01-27  
**Scope:** Portal translation keys in `messages/src/{locale}/portal.json`

## Summary

Reviewed translation keys for consistency, naming patterns, and singular/plural usage. Found several areas for improvement.

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

5. **Review other sections:**
   - Check `portal.clients`, `portal.files`, `portal.consultations` for similar patterns
   - Ensure consistency across all portal sections

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

**Review Status:** ✅ Complete  
**Last Updated:** 2025-01-27

---

## ✅ Changes Made

### 2025-01-27

1. ✅ Added `portal.requests.title_singular` - "Request" / "בקשה"
2. ✅ Added `portal.requests.selected_singular` - "request selected" / "בקשה נבחרה"
3. ✅ Added `portal.requests.requestsIncluded_singular` - "request included" / "בקשה כלולה"
4. ✅ Updated `RequestsClient.tsx` to use singular variant when count = 1
5. ✅ Created comprehensive review document
