# E2E Tests for PoolRoute OS

This directory contains end-to-end tests using Playwright for the PoolRoute OS application.

## Setup

1. Install dependencies:
   ```bash
   cd e2e
   npm install
   npm run install  # Install Playwright browsers
   ```

2. Ensure the development servers are running:
   ```bash
   # In the root directory
   npm run dev
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Test Structure

- `tests/auth.spec.ts` - Authentication flow tests (login, logout, registration)
- `tests/dashboard.spec.ts` - Dashboard functionality tests
- `tests/routes.spec.ts` - Route management tests
- `tests/helpers/` - Shared utilities and helpers

## Test Data

Tests use the demo data from the backend seed file:

- **Admin User**: `admin@poolroute.com` / `password123`
- **Operator**: `john.smith@example.com` / `password123`
- **Seller**: `mike.wilson@example.com` / `password123`
- **Buyer**: `lisa.brown@example.com` / `password123`

## Configuration

The tests are configured to:

- Run against `http://localhost:3000` (frontend)
- Automatically start backend (`http://localhost:3001`) and frontend servers
- Take screenshots on failure
- Record videos on failure
- Generate HTML reports

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'operator');
  });

  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### Using Helpers

```typescript
import { login, logout, DEMO_USERS } from './helpers/auth';
import { setupTestEnvironment } from './helpers/setup';

// Login with different user types
await login(page, 'admin');
await login(page, 'seller');

// Logout
await logout(page);

// Setup test environment
await setupTestEnvironment(page);
```

## Best Practices

1. **Use Page Object Model** for complex pages
2. **Wait for elements** instead of using fixed delays
3. **Use data-testid attributes** for reliable element selection
4. **Clean up state** between tests if needed
5. **Test critical user journeys** rather than every UI detail
6. **Use descriptive test names** that explain the expected behavior

## Troubleshooting

### Services Not Starting
Ensure both backend and frontend are running:
```bash
# Check backend
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000
```

### Database Issues
Reset the database if tests are failing due to data conflicts:
```bash
cd backend
npm run db:migrate
npm run seed
```

### Browser Issues
Reinstall Playwright browsers:
```bash
npm run install
```

## CI/CD Integration

For continuous integration, use:
```bash
# Run tests in CI mode
CI=true npm test

# Or with specific configuration
npm test -- --reporter=junit
```