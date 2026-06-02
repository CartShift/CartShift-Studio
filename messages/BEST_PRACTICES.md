# Translation System Best Practices

## 📂 File Structure

The translation system uses a **split-file architecture** to maintain manageability.

- **Source Files**: `messages/src/{locale}/**/*.json`
- **Generated Files**: `messages/{locale}.json` (DO NOT EDIT DIRECTLY)

### Portal Translations

Portal translations are split by feature in `messages/src/{locale}/portal/`.
Example: `dashboard.json`, `settings.json`, `requests.json`.

### Common Translations

General UI elements (buttons, common errors) live in `messages/src/{locale}/common.json`.

## 📝 Workflow

1. **Adding New Keys**:
   - Locate the relevant feature file in `messages/src/en/`.
   - Add the key (maintain alphabetical order if possible).
   - Add the corresponding key to `messages/src/he/`.

2. **Watch Mode**:
   - The watch mode is integrated into `pnpm dev`.
   - It runs automatically in the background and merges debounced source changes.
   - You can also run it standalone via `pnpm i18n:watch` if needed.

3. **Validation**:
   - Run `pnpm i18n:validate` to check for missing keys or mismatching parameters.
   - The validation script runs automatically on pre-commit (planned).

## 🔑 Naming Conventions

- Use **camelCase** for keys: `myKeyName`
- Use **descriptive keys** for nesting: `settings.profile.uploadButton`
- Avoid generic keys like `title` at the top level of a file (unless it's a very specific file).

## 🧩 TypeScript Types

Types are provided by the `next-intl` augmentation in `i18n/global.ts`.
**Always use `useTranslations('portal')` for portal translations** - this provides better type safety and cleaner code.

```tsx
// ✅ CORRECT: Use namespaced hook for portal translations
import { useTranslations } from 'next-intl';

const t = useTranslations('portal'); // Typesafe!
<h1>{t('dashboard.title')}</h1>; // No 'portal.' prefix needed

// ❌ WRONG: Don't use useTranslations() without namespace
const t = useTranslations();
<h1>{t('portal.dashboard.title')}</h1>; // Avoid this pattern
```

### Standardized Pattern (2026-01-21)

**All portal files now use:**

- `useTranslations('portal')` - Namespaced hook
- Keys without `portal.` prefix (e.g., `t('files.title')` not `t('portal.files.title')`)

**Benefits:**

- Better TypeScript type safety and autocomplete
- Cleaner, shorter translation keys
- Consistent pattern across entire codebase
- Easier refactoring and maintenance
