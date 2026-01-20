# Portal Testing Documentation

## Overview

A comprehensive testing suite has been set up for the CartShift Studio portal functionality using Vitest and React Testing Library.

## Test Infrastructure

### Setup Files

- `vitest.config.ts` - Vitest configuration with React plugin and path aliases
- `tests/setup.ts` - Global test setup with jsdom environment and cleanup
- `tests/utils/test-utils.tsx` - Testing utilities with NextIntl provider
- `tests/utils/mock-firebase.ts` - Firebase mocking utilities

### Test Scripts

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui
```

## Test Coverage

### Authentication Tests

- **Location**: `tests/portal/auth/login.test.tsx`
- **Coverage**:
  - Login form rendering
  - Form validation
  - Email format validation
  - Error handling

### Portal Root Tests

- **Location**: `tests/portal/root.test.tsx`
- **Coverage**:
  - Loading states
  - Authentication redirects
  - Agency user routing
  - Organization routing
  - Onboarding flow

### Dashboard Tests

- **Location**: `tests/portal/dashboard.test.tsx`
- **Coverage**:
  - Loading states
  - Access control
  - Data subscription
  - Error handling
  - UI rendering

### Settings Tests

- **Location**: `tests/portal/settings.test.tsx`
- **Coverage**:
  - Settings page rendering
  - Loading states
  - Form functionality

### Requests Tests

- **Location**: `tests/portal/requests.test.tsx`
- **Coverage**:
  - Request list rendering
  - Loading states
  - Access control
  - New request button

### Portal Shell Tests

- **Location**: `tests/portal/portal-shell.test.tsx`
- **Coverage**:
  - Navigation rendering
  - Authentication checks
  - Authorization logic
  - Loading states

## Mocking Strategy

### Firebase Mocks

- Auth state changes
- Firestore subscriptions
- User data
- Organization data

### Next.js Mocks

- Navigation (useRouter, usePathname)
- Search params
- Internationalization

## Running Tests

### Basic Usage

```bash
pnpm test:run
```

### Watch Mode

```bash
pnpm test
```

### With UI

```bash
pnpm test:ui
```

## Test Structure

```
tests/
├── setup.ts                    # Global setup
├── utils/
│   ├── test-utils.tsx          # Test utilities
│   └── mock-firebase.ts        # Firebase mocks
└── portal/
    ├── auth/
    │   └── login.test.tsx
    ├── root.test.tsx
    ├── dashboard.test.tsx
    ├── settings.test.tsx
    ├── requests.test.tsx
    └── portal-shell.test.tsx
```

## Adding New Tests

1. Create test file in appropriate directory
2. Import test utilities:
   ```tsx
   import { render, screen, waitFor } from '../utils/test-utils';
   import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
   ```
3. Set up mocks for required dependencies
4. Write test cases following existing patterns

## Known Issues

- Some tests may need additional mocking for complex components
- React state updates in async operations may need `act()` wrapping
- Some integration tests are simplified placeholders

## Future Improvements

- Add E2E tests with Playwright
- Increase test coverage for edge cases
- Add visual regression tests
- Test error boundaries
- Add performance tests
