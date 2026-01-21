# ESLint Translation Pattern Rule

## Overview

The `portal-translations/enforce-portal-translations` ESLint rule enforces the standardized translation pattern across all portal files.

## Enforced Pattern

**✅ CORRECT:**

```tsx
// Use namespaced hook
const t = useTranslations('portal');

// Keys without 'portal.' prefix
<h1>{t('files.title')}</h1>
<p>{t('common.error')}</p>
```

**❌ WRONG:**

```tsx
// Don't use useTranslations() without namespace
const t = useTranslations();

// Don't use 'portal.' prefix with namespaced hook
<h1>{t('portal.files.title')}</h1>;
```

## What the Rule Checks

1. **Enforces `useTranslations('portal')` in portal files**
   - Detects `useTranslations()` without namespace
   - Auto-fixes to `useTranslations('portal')`

2. **Prevents `portal.` prefix when using namespaced hook**
   - Detects `t('portal.key')` when using `useTranslations('portal')`
   - Auto-fixes to `t('key')`

3. **Works with template literals**
   - Handles dynamic keys like `t(\`portal.files.${key}\`)`
   - Fixes to `t(\`files.${key}\`)`

## File Scope

The rule only applies to files matching the pattern:

- `app/[locale]/portal/**/*.{ts,tsx,js,jsx}`

Files outside this pattern are not checked.

## Auto-Fix

The rule is **auto-fixable** - run `pnpm lint:fix` to automatically fix violations:

```bash
pnpm lint:fix
```

## Examples

### Example 1: Wrong Hook Usage

```tsx
// ❌ Before
const t = useTranslations();

// ✅ After (auto-fixed)
const t = useTranslations('portal');
```

### Example 2: Wrong Key Prefix

```tsx
// ❌ Before
const t = useTranslations('portal');
<h1>{t('portal.files.title')}</h1>;

// ✅ After (auto-fixed)
const t = useTranslations('portal');
<h1>{t('files.title')}</h1>;
```

### Example 3: Template Literal

```tsx
// ❌ Before
const t = useTranslations('portal');
{
  t(`portal.pricing.status.${status}`);
}

// ✅ After (auto-fixed)
const t = useTranslations('portal');
{
  t(`pricing.status.${status}`);
}
```

## Configuration

The rule is configured in `eslint.config.mjs`:

```js
{
  rules: {
    "portal-translations/enforce-portal-translations": "error",
  },
}
```

## Benefits

- ✅ **Consistency**: All portal files follow the same pattern
- ✅ **Type Safety**: Better TypeScript autocomplete and validation
- ✅ **Maintainability**: Easier to refactor and update translations
- ✅ **Auto-Fix**: Violations can be automatically corrected

## Related Documentation

- [Translation Best Practices](../messages/BEST_PRACTICES.md)
- [Translation Consistency Review](./Translation-Consistency-Review.md)
