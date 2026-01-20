# Portal Testing Suite

Comprehensive test suite for the CartShift Studio portal functionality.

## Test Structure

```
tests/
├── setup.ts                 # Vitest configuration and global setup
├── utils/
│   ├── test-utils.tsx       # Testing utilities and providers
│   └── mock-firebase.ts     # Firebase mocking utilities
└── portal/
    ├── auth/
    │   └── login.test.tsx   # Login page tests
    ├── root.test.tsx        # Portal root routing tests
    ├── dashboard.test.tsx   # Dashboard page tests
    ├── settings.test.tsx   # Settings page tests
    ├── requests.test.tsx   # Requests page tests
    └── portal-shell.test.tsx # Portal shell navigation tests
```

## Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui
```

## Test Coverage

### Authentication

- Login form validation
- Error handling
- Redirect logic

### Portal Root

- Loading states
- Authentication redirects
- Agency user routing
- Organization routing
- Onboarding flow

### Dashboard

- Loading states
- Access control
- Data subscription
- Error handling

### Settings

- Organization settings
- User profile
- Notification preferences

### Requests

- Request list rendering
- Filtering and search
- Access control

### Portal Shell

- Navigation rendering
- Authentication checks
- Authorization logic

## Mocking

The test suite uses comprehensive mocks for:

- Firebase Auth
- Firestore
- Next.js navigation
- Portal services

## Adding New Tests

1. Create test file in appropriate directory
2. Import test utilities from `tests/utils/test-utils.tsx`
3. Use Firebase mocks from `tests/utils/mock-firebase.ts`
4. Follow existing test patterns
