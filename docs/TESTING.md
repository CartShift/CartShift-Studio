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

## Agent / Browser Visual Testing (Portal)

For local visual QA (Cursor browser, Playwright, gstack browse), use the **localhost dev login** flow instead of filling the login form.

### Setup (once)

1. Ensure Firebase Admin credentials are in `.env.local` (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
2. Pick an existing portal test account (must have a `portal_users` doc and at least one org for dashboard access).
3. Add to `.env.local`:

```env
PORTAL_DEV_AUTH_ENABLED=true
PORTAL_DEV_AUTH_SECRET=choose-a-long-random-string
PORTAL_DEV_AUTH_EMAIL=your-test-user@example.com
```

4. Restart `pnpm dev`.

### Agent login URL

Open this once per browser session (localhost only):

```text
http://localhost:3000/en/portal/dev-login/?secret=YOUR_SECRET&redirect=/dashboard/
```

The page exchanges the secret for a Firebase custom token, signs in with real auth + session cookie, then redirects into the portal.

For agency test accounts, dev login also sets `agencyRole: owner` and ensures `portal_members.role: owner` for every org in the user's `organizations` array.

### Safety guards

- `NODE_ENV=development` only
- `PORTAL_DEV_AUTH_ENABLED=true` required (opt-in)
- Request host must be `localhost` / `127.0.0.1`
- Secret must match `PORTAL_DEV_AUTH_SECRET`
- Disabled routes return **404** (not exposed in production builds)

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| 404 on `/api/dev/portal-auth` | Set `PORTAL_DEV_AUTH_ENABLED=true` and restart dev server |
| `admin-not-configured` | Add Firebase Admin env vars |
| Redirects to login after dev-login | Test user missing Firestore `portal_users` doc or org membership |
| Works in browser but not agent | Agent must hit `localhost`, not production/preview URLs |

## Future Improvements

- Add E2E tests with Playwright
- Increase test coverage for edge cases
- Add visual regression tests
- Test error boundaries
- Add performance tests
