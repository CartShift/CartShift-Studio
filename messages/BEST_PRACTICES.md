# Translation System Best Practices

## File Structure

- **Source (SSOT):** `messages/src/{locale}/**/*.json`
- **Generated:** `messages/{locale}.json` — never edit by hand

Portal copy is split by feature under `messages/src/{locale}/portal/` (e.g. `requests.json`, `dashboard.json`).

## Adding a New Key

1. Add the key to the matching English source file under `messages/src/en/…`
2. Add the same key path to `messages/src/he/…`
3. Run `pnpm i18n:merge` (or rely on `pnpm dev` / `prebuild`)
4. Run `pnpm i18n:validate` if you want an immediate parity check
5. Use a namespace helper in UI code (see below)

## Canonical Code Patterns

Helpers live in `@/lib/i18n/translations`. Prefer them over raw `useTranslations()` so ESLint and validation stay consistent.

### Portal

```tsx
import { usePortalTranslations } from '@/lib/i18n/translations';

const t = usePortalTranslations();
<h1>{t('dashboard.title')}</h1>;

// Optional deeper namespace
const tToast = usePortalTranslations('portal.requests.toast');
```

```tsx
// ❌ Avoid root hook + portal. prefix in portal files
const t = useTranslations();
t('portal.dashboard.title');
```

Server components / metadata:

```tsx
import { getPortalTranslations } from '@/lib/i18n/translations';

const t = await getPortalTranslations({ locale, namespace: 'portal.sidebar.nav' });
```

### Website / common

```tsx
import { useWebsiteTranslations, useCommonTranslations } from '@/lib/i18n/translations';

const t = useWebsiteTranslations(); // hero.*, nav.*, marketing.*, …
const tCommon = useCommonTranslations(); // same root tree; use for shared chrome
```

### Analyzer

```tsx
import { useAnalyzerTranslations } from '@/lib/i18n/translations';

const t = useAnalyzerTranslations();
t('coverage.reasons.slowLcp');
```

### Dynamic enum → key maps

Use `@/lib/i18n/portal-translation-keys` / `analyzer-translation-keys` with **relative** keys when the hook is already namespaced:

```tsx
const t = usePortalTranslations();
t(getStatusTranslationKey(status)); // requests.status.new
```

## Naming

- **camelCase** keys: `uploadButton`
- Nest by feature: `settings.profile.uploadButton`
- Avoid generic top-level keys like bare `title` unless the file is tiny and scoped

## Validation (what fails the build)

`pnpm i18n:validate` (wired into `prebuild`) hard-fails on:

- Missing source files between `en` / `he`
- Missing keys between locales
- Interpolation `{param}` mismatches
- Structure type mismatches (string vs object)
- Empty string values
- Static `t('…')` keys in code that do not exist in messages

Unused-key detection is a **warning** only (dynamic keys cause false positives).

## ESLint

- `portal-translations/enforce-portal-translations` (**error**): portal files under `app/.../portal`, `components/portal`, and `lib/hooks` must not use bare `useTranslations()`; no redundant `portal.` key prefix under a portal namespace.
- `portal-translations/no-hardcoded-jsx-text` (**warn**): flags likely user-facing hardcoded JSX text in website/portal UI.

Auto-fix portal hook issues with `pnpm lint:fix`.

## TypeScript

Message types come from `i18n/global.ts` (augments `next-intl` from `messages/en.json`). Namespaced helpers give the best autocomplete.
