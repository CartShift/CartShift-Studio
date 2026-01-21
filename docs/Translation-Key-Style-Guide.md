# Translation Key Style Guide

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Scope:** All translation files in `messages/src/{locale}/`

## Purpose

This guide establishes consistent patterns and best practices for creating and maintaining translation keys across the CartShift Studio codebase. Following these guidelines ensures maintainability, consistency, and proper internationalization support.

---

## 📋 Table of Contents

1. [File Organization](#file-organization)
2. [Naming Conventions](#naming-conventions)
3. [Singular/Plural Handling](#singularplural-handling)
4. [Key Structure Patterns](#key-structure-patterns)
5. [ICU Pluralization](#icu-pluralization)
6. [Common Patterns](#common-patterns)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## File Organization

### Translation File Structure

```
messages/src/
├── en/
│   ├── common.json      # Shared/common translations
│   ├── portal.json      # Portal/workspace translations
│   ├── website.json     # Public website translations
│   ├── cv.json          # CV/resume translations
│   └── legal.json       # Legal pages translations
└── he/
    └── [same structure]
```

### File Naming Rules

- Use lowercase with hyphens: `common.json`, `portal.json`
- One logical domain per file (e.g., all portal-related keys in `portal.json`)
- Keep files focused and avoid excessive nesting

---

## Naming Conventions

### Key Naming Patterns

#### 1. **Hierarchical Structure**

Use dot notation for logical grouping:

```json
{
  "portal": {
    "requests": {
      "title": "Project Requests",
      "form": {
        "titleLabel": "What needs to be done?",
        "errors": {
          "titleShort": "Title must be at least 5 characters"
        }
      }
    }
  }
}
```

#### 2. **Suffix Conventions**

| Suffix                   | Usage                  | Example                                |
| ------------------------ | ---------------------- | -------------------------------------- |
| `*Label`                 | Form field labels      | `titleLabel`, `emailLabel`             |
| `*Placeholder`           | Input placeholders     | `titlePlaceholder`, `emailPlaceholder` |
| `*Desc` / `*Description` | Descriptions/subtitles | `subtitle`, `description`              |
| `*Title`                 | Section/page titles    | `title`, `pageTitle`                   |
| `*Button`                | Button text (optional) | `submitButton`, `cancelButton`         |
| `*Confirm`               | Confirmation messages  | `deleteConfirm`, `cancelConfirm`       |
| `*Error` / `errors.*`    | Error messages         | `errors.titleShort`, `errors.generic`  |
| `*Success`               | Success messages       | `successTitle`, `successDesc`          |
| `*Singular`              | Singular form variant  | `title_singular`, `selected_singular`  |

#### 3. **Namespace Organization**

Group related keys under logical namespaces:

```json
{
  "portal": {
    "requests": {
      "form": { ... },      // Form-related keys
      "toast": { ... },     // Toast notifications
      "errors": { ... },    // Error messages
      "status": { ... },    // Status values
      "type": { ... }       // Type values
    }
  }
}
```

---

## Singular/Plural Handling

### When to Add Singular Variants

**Add `_singular` suffix when:**

- Key is used with dynamic counts (e.g., `items.length`)
- Display shows count + label (e.g., "1 request selected" vs "2 requests selected")
- Text changes grammatically between singular/plural

**Don't add when:**

- Key is a static title/label (e.g., "Team Members" section title)
- Count is always > 1 in practice
- Key uses ICU pluralization (see below)

### Implementation Pattern

```typescript
// In component
{
  count === 1 ? t('portal.requests.selected_singular') : t('portal.requests.selected');
}
```

```json
// In translation file
{
  "requests": {
    "selected": "requests selected",
    "selected_singular": "request selected"
  }
}
```

### Examples from Codebase

✅ **Good - Has singular variant:**

- `portal.requests.selected` / `portal.requests.selected_singular`
- `portal.files.totalFiles` / `portal.files.totalFiles_singular`
- `blog.content.articles` / `blog.content.articles_singular`

❌ **Bad - Missing singular variant:**

- ~~`portal.team.activeMembers`~~ (but this is static, so OK)
- Any count-based display without singular variant

---

## ICU Pluralization

### When to Use ICU Format

Use ICU pluralization for:

- Complex pluralization rules (e.g., languages with multiple plural forms)
- Keys that need more than just singular/plural (e.g., zero, one, few, many)
- When you want to embed the count in the message

### ICU Format Syntax

```json
{
  "jobsCount": "{count, plural, =0 {No Jobs} =1 {1 Job} other {# Jobs}}"
}
```

### Current Usage

✅ **Example from codebase:**

```json
{
  "pricing": {
    "quote": {
      "jobsCount": "{count, plural, =1 {1 Job} other {# Jobs}}"
    }
  }
}
```

### When NOT to Use ICU

- Simple singular/plural cases (use `_singular` suffix instead)
- Static labels that don't change
- When the component already handles the count logic

---

## Key Structure Patterns

### 1. Section Titles

```json
{
  "sectionName": {
    "title": "Section Title", // Plural form
    "title_singular": "Item Title", // Singular form (if needed)
    "subtitle": "Section description"
  }
}
```

### 2. Form Fields

```json
{
  "form": {
    "titleLabel": "Field Label",
    "titlePlaceholder": "Placeholder text...",
    "titleRequired": "Field is required",
    "errors": {
      "titleShort": "Title must be at least 5 characters",
      "titleLong": "Title is too long"
    }
  }
}
```

### 3. Status/Type Enums

```json
{
  "status": {
    "new": "New",
    "in_progress": "In Progress",
    "completed": "Completed"
  },
  "type": {
    "design": "Design",
    "feature": "New Feature",
    "bug": "Bug Fix"
  }
}
```

### 4. Toast Notifications

```json
{
  "toast": {
    "successTitle": "Success!",
    "successDesc": "Operation completed successfully",
    "errorTitle": "Error",
    "errorDesc": "Operation failed. Please try again."
  }
}
```

### 5. Empty States

```json
{
  "empty": {
    "title": "No items found",
    "description": "Start by creating your first item.",
    "action": "Create First Item"
  }
}
```

### 6. Action Buttons

```json
{
  "newItem": "New Item",
  "editItem": "Edit Item",
  "deleteItem": "Delete Item",
  "saveChanges": "Save Changes",
  "cancel": "Cancel"
}
```

---

## Common Patterns

### Count-Based Displays

**Pattern:**

```json
{
  "items": "items",
  "items_singular": "item"
}
```

**Usage:**

```typescript
{
  count === 1 ? t('items_singular') : t('items');
}
```

### Dynamic Messages with Parameters

**Pattern:**

```json
{
  "welcome": "Welcome, {name}!",
  "showing": "Showing {count} of {total} results"
}
```

**Usage:**

```typescript
t('welcome', { name: userName });
t('showing', { count: 10, total: 50 });
```

### Conditional Messages

**Pattern:**

```json
{
  "status": {
    "active": "Active",
    "inactive": "Inactive"
  }
}
```

**Usage:**

```typescript
t(`portal.requests.status.${status.toLowerCase()}`);
```

---

## Best Practices

### ✅ DO

1. **Use consistent naming patterns** across all files
2. **Add singular variants** for count-based displays
3. **Group related keys** under logical namespaces
4. **Use descriptive suffixes** (`Label`, `Placeholder`, `Error`)
5. **Keep keys flat** when possible (max 3-4 levels deep)
6. **Use parameterized messages** for dynamic content
7. **Document complex patterns** in code comments
8. **Test both languages** (English and Hebrew) after changes

### ❌ DON'T

1. **Don't hardcode plural forms** in count-based displays
2. **Don't create overly deep nesting** (max 4-5 levels)
3. **Don't mix naming conventions** (stick to one pattern)
4. **Don't use abbreviations** unless widely understood
5. **Don't duplicate keys** across files (use common.json for shared keys)
6. **Don't edit generated files** (`messages/en.json`, `messages/he.json`)
7. **Don't forget to merge** after editing source files

---

## Examples

### Example 1: Simple Count Display

**Translation:**

```json
{
  "files": {
    "totalFiles": "Total Files",
    "totalFiles_singular": "Total File"
  }
}
```

**Component:**

```typescript
{
  files.length;
}
{
  (' ');
}
{
  files.length === 1 ? t('portal.files.totalFiles_singular') : t('portal.files.totalFiles');
}
```

### Example 2: Form with Validation

**Translation:**

```json
{
  "form": {
    "titleLabel": "What needs to be done?",
    "titlePlaceholder": "Summarize your request...",
    "errors": {
      "titleShort": "Title must be at least 5 characters",
      "titleLong": "Title is too long",
      "required": "This field is required"
    }
  }
}
```

**Component:**

```typescript
<Input
  label={t('portal.requests.form.titleLabel')}
  placeholder={t('portal.requests.form.titlePlaceholder')}
  error={errors.title && t('portal.requests.form.errors.titleShort')}
/>
```

### Example 3: Status Badge

**Translation:**

```json
{
  "status": {
    "new": "New",
    "in_progress": "In Progress",
    "completed": "Completed"
  }
}
```

**Component:**

```typescript
<Badge>
  {t(`portal.requests.status.${request.status.toLowerCase()}`)}
</Badge>
```

### Example 4: ICU Pluralization

**Translation:**

```json
{
  "quote": {
    "jobsCount": "{count, plural, =1 {1 Job} other {# Jobs}}"
  }
}
```

**Component:**

```typescript
{
  t('portal.pricing.quote.jobsCount', { count: quoteItems.length });
}
```

---

## Checklist for New Translation Keys

When adding new translation keys, verify:

- [ ] Key follows naming conventions (suffixes, structure)
- [ ] Both English and Hebrew translations added
- [ ] Singular variant added if used with counts
- [ ] Key is in the correct file (portal vs website vs common)
- [ ] No duplicate keys exist
- [ ] Source files edited (not generated files)
- [ ] Merge script run after changes
- [ ] Component updated to use new key
- [ ] Tested in both languages

---

## Migration Guide

### Converting Hardcoded Plurals

**Before:**

```typescript
{
  count;
}
{
  t('portal.requests.selected');
} // Always "requests selected"
```

**After:**

```typescript
{
  count;
}
{
  (' ');
}
{
  count === 1 ? t('portal.requests.selected_singular') : t('portal.requests.selected');
}
```

**Translation:**

```json
{
  "selected": "requests selected",
  "selected_singular": "request selected"
}
```

---

## File-Specific Guidelines

### `common.json`

- Shared translations used across multiple sections
- Navigation, common actions, error messages
- Keep generic and reusable

### `portal.json`

- All portal/workspace related translations
- Client and agency views
- Request management, team, files, pricing

### `website.json`

- Public website content
- Hero sections, services, blog, testimonials
- Marketing and informational content

### `cv.json` & `legal.json`

- Static content (no count-based displays expected)
- CV/resume content
- Legal pages (privacy, terms)

---

## Review Process

### Before Merging

1. ✅ Check naming conventions
2. ✅ Verify both languages have translations
3. ✅ Test singular/plural displays
4. ✅ Run merge script
5. ✅ Test in application

### Code Review Checklist

- [ ] Keys follow style guide
- [ ] No hardcoded plurals in count displays
- [ ] Proper use of ICU vs `_singular` suffix
- [ ] Both languages updated
- [ ] Components use keys correctly

---

## Related Documentation

- [Translation Consistency Review](./Translation-Consistency-Review.md) - Detailed review findings
- [Messages README](../messages/README.md) - File organization details
- [next-intl Documentation](https://next-intl-docs.vercel.app/) - Framework documentation

---

## Quick Reference

### Common Suffixes

| Suffix         | Example             | Usage                 |
| -------------- | ------------------- | --------------------- |
| `*Label`       | `titleLabel`        | Form field labels     |
| `*Placeholder` | `emailPlaceholder`  | Input placeholders    |
| `*Title`       | `pageTitle`         | Page/section titles   |
| `*Desc`        | `description`       | Descriptions          |
| `*Error`       | `errors.titleShort` | Error messages        |
| `*Singular`    | `selected_singular` | Singular form variant |

### Key Structure

```
{domain}.{section}.{subsection}.{key}
portal.requests.form.titleLabel
website.blog.content.articles
```

### Count Display Pattern

```typescript
{
  count === 1 ? t('key_singular') : t('key');
}
```

---

**Last Updated:** 2025-01-27  
**Maintained By:** Development Team
