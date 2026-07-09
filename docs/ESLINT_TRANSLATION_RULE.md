# ESLint Translation Pattern Rules

## Overview

The `portal-translations` ESLint plugin enforces consistent next-intl usage and surfaces hardcoded UI copy.

| Rule | Level | Scope |
|------|-------|--------|
| `enforce-portal-translations` | error | `app/[locale]/portal/**`, `components/portal/**`, `lib/hooks/**` |
| `no-hardcoded-jsx-text` | warn | Website sections/layout/templates + portal UI |

## Portal rule — enforced pattern

**Correct:**

```tsx
import { usePortalTranslations } from '@/lib/i18n/translations';

const t = usePortalTranslations();
<h1>{t('files.title')}</h1>;
```

Also accepted (legacy-compatible):

```tsx
const t = useTranslations('portal');
```

**Wrong:**

```tsx
const t = useTranslations();
t('portal.files.title');
```

### What it checks

1. Bare `useTranslations()` in portal files → must be `usePortalTranslations()` or `useTranslations('portal' | 'portal.*')`
2. Redundant `portal.` key prefix when the hook namespace is already portal-scoped (including nested `portal.activity.actions`)
3. Auto-fix adds the `@/lib/i18n/translations` import when rewriting bare hooks

### Auto-fix

```bash
pnpm lint:fix
```

## Hardcoded JSX text (warn)

Flags JSX text nodes that look like user-facing copy (letters in EN/HE). Brand tokens (`CartShift`, `Shopify`, …) and short acronyms are allowlisted.

Migrate flagged strings into `messages/src/{locale}/…` and load them via a translation helper.

## Configuration

```js
// eslint.config.mjs
'portal-translations/enforce-portal-translations': 'error',
'portal-translations/no-hardcoded-jsx-text': 'warn',
```

## Related

- [Translation Best Practices](../messages/BEST_PRACTICES.md)
- [messages/README.md](../messages/README.md)
- Helpers: `lib/i18n/translations.ts`
