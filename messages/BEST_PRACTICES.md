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
   - Run `npm run i18n:watch` in a separate terminal while developing.
   - Changes will be automatically merged and types regenerated.

3. **Validation**:
   - Run `npm run i18n:validate` to check for missing keys or mismatching parameters.
   - The validation script runs automatically on pre-commit (planned).

## 🔑 Naming Conventions

- Use **camelCase** for keys: `myKeyName`
- Use **descriptive keys** for nesting: `settings.profile.uploadButton`
- Avoid generic keys like `title` at the top level of a file (unless it's a very specific file).

## 🧩 TypeScript Types

Types are automatically generated into `types/i18n.ts`.
Use `useTranslations()` hook with the correct namespace.

```tsx
// Example with strict typing
import { Portal } from '~/lib/types/i18n';
import { useTranslations } from 'next-intl';

const t = useTranslations<Portal>('portal'); // Typesafe!
<h1>{t('dashboard.title')}</h1>;
```
