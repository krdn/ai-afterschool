# E2E Test Maintenance Guide

**Last Updated:** 2026-02-07
**Phase:** 28-04 Complete
**Test Framework:** Playwright

---

## Running Tests

### Full Suite

```bash
# Start dev server (required for E2E tests)
npm run dev &

# Wait for server to start
sleep 10

# Run full test suite
npm run test:e2e

# Or with HTML reporter
npm run test:e2e -- --reporter=html

# View results
npx playwright show-report
```

### Single Spec File

```bash
# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run specific test by name
npm run test:e2e -- --grep "AUTH-01"
```

### Debug Mode

```bash
# Run with debug UI (inspect selectors live)
npm run test:e2e -- --debug

# Run headed (see browser)
npm run test:e2e -- --headed

# Run specific test in debug mode
npm run test:e2e -- auth.spec.ts --debug
```

### Configuration

```bash
# Update base URL if not using localhost:3000
# playwright.config.ts
baseURL: 'http://localhost:3000'
```

---

## Adding New Tests

### 1. Create Test File

Create new spec file in `tests/e2e/`:

```typescript
// tests/e2e/feature.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTeacher, TEST_ACCOUNTS } from '../utils/auth';

test.describe('Feature Description', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### 2. Use data-testid Selectors

**Always add `data-testid` to components when creating features:**

```tsx
// ❌ BAD: Text-based selector (fragile)
<Button>Submit</Button>
// test: await page.click('text=Submit')

// ✅ GOOD: data-testid selector (stable)
<Button data-testid="submit-button">Submit</Button>
// test: await page.click('[data-testid="submit-button"]')
```

### 3. Naming Convention

```
data-testid="[component]-[element]"

Examples:
- student-delete-button
- analysis-loading
- counseling-calendar
- teacher-name-input
- email-input
- login-button
```

For tabs, use `data-tab`:
```tsx
<button data-tab="analysis">분석</button>
```

### 4. Update Selectors Utility (Optional)

If reusing selectors, add to `tests/utils/selectors.ts`:

```typescript
export const Selectors = {
  login: {
    email: '[data-testid="email-input"]',
    password: '[data-testid="password-input"]',
    button: '[data-testid="login-button"]',
  },
  // Add more...
};
```

---

## When Tests Fail

### 1. Run with HTML Reporter

```bash
npm run test:e2e -- --reporter=html
npx playwright show-report
```

HTML reporter provides:
- Screenshot of failure
- DOM snapshot
- Error details
- Step-by-step trace

### 2. Categorize Failure Type

**A. Selector Issues (Most Common)**

Symptoms:
- `waiting for locator(...)`
- `element(s) not found`

Solutions:
1. Add missing `data-testid` to component
2. Check selector syntax (typos, quotes)
3. Use `waitForSelector` for dynamic content:

```typescript
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
```

**B. Timeout Issues**

Symptoms:
- `Test timeout of 30000ms exceeded`
- `Timeout 10000ms exceeded`

Solutions:
1. Increase timeout for specific test:

```typescript
test.setTimeout(60000); // 60s instead of 30s
```

2. Use explicit waits instead of relying on timeouts:

```typescript
// ❌ BAD
await page.waitForTimeout(5000);

// ✅ GOOD
await page.waitForSelector('[data-testid="loaded"]');
```

3. Check if server is running on port 3000

**C. Navigation Issues**

Symptoms:
- `waiting for navigation`
- `waitForURL timeout`

Solutions:
1. Use more flexible URL matching:

```typescript
// Exact match (strict)
await page.waitForURL('/students');

// Pattern match (flexible)
await page.waitForURL(/students/);

// Predicate (most flexible)
await page.waitForURL(url => url.pathname.includes('/students'));
```

2. Wait for load state:

```typescript
await page.waitForLoadState('domcontentloaded');
// or
await page.waitForLoadState('networkidle');
```

**D. Authentication Issues**

Symptoms:
- Redirected to login page unexpectedly
- Session not persisting

Solutions:
1. Use provided auth helpers:

```typescript
import { loginAsTeacher, loginAsAdmin, TEST_ACCOUNTS } from '../utils/auth';

// Always use TEST_ACCOUNTS for credentials
await loginAsTeacher(page, TEST_ACCOUNTS.teacher.email, TEST_ACCOUNTS.teacher.password);
```

2. Check seed.ts for valid test accounts:

```bash
cat prisma/seed.ts
```

**E. API/Mock Issues**

Symptoms:
- 404 on API endpoints
- Mock data not matching

Solutions:
1. Verify API endpoint exists
2. Check if endpoint requires authentication
3. Use test database seed for consistent data

### 3. Fix and Re-run Specific Test

```bash
# Run only failed test file
npm run test:e2e -- auth.spec.ts

# Run only tests with specific name
npm run test:e2e -- --grep "test name"
```

---

## Test Structure Patterns

### Authentication Required

```typescript
import { loginAsTeacher } from '../utils/auth';

test.describe('Protected Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('requires auth', async ({ page }) => {
    // Test implementation
  });
});
```

### Multi-step Flow

```typescript
test('complete flow', async ({ page }) => {
  // Step 1: Navigate
  await page.goto('/students');
  await expect(page).toHaveURL(/students/);

  // Step 2: Action
  await page.click('[data-testid="add-student-button"]');

  // Step 3: Verify
  await expect(page.locator('[data-testid="student-form"]')).toBeVisible();
});
```

### Conditional Assertions

```typescript
test('handle optional elements', async ({ page }) => {
  const element = page.locator('[data-testid="optional-element"]');

  const count = await element.count();
  if (count > 0) {
    await expect(element).toBeVisible();
  }
});
```

### Data-driven Tests

```typescript
const testCases = [
  { input: 'valid', expected: 'success' },
  { input: 'invalid', expected: 'error' },
];

for (const { input, expected } of testCases) {
  test(`validates ${input} input`, async ({ page }) => {
    // Test with input
    await page.fill('[data-testid="input"]', input);
    await expect(page.locator('[data-testid="result"]')).toContainText(expected);
  });
}
```

---

## Selector Best Practices

### ✅ DO

```typescript
// Use data-testid
await page.click('[data-testid="submit-button"]');

// Use role for accessibility
await page.click('button[name="submit"]');

// Use test ID in fixtures
await page.setInputFiles('[data-testid="file-input"]', './tests/fixtures/image.jpg');

// Use explicit waits
await page.waitForSelector('[data-testid="modal"]', { state: 'visible' });
```

### ❌ DON'T

```typescript
// Don't use text (fragile to i18n)
await page.click('text=Submit');

// Don't use CSS classes (implementation detail)
await page.click('.btn-primary');

// Don't use XPath (brittle)
await page.click('//button[@text="Submit"]');

// Don't use arbitrary timeouts
await page.waitForTimeout(5000);
```

---

## Test Data Management

### Use Seed Data

```typescript
// Valid test accounts from prisma/seed.ts
import { TEST_ACCOUNTS } from '../utils/auth';

const admin = TEST_ACCOUNTS.admin;  // admin@afterschool.com
const teacher = TEST_ACCOUNTS.teacher;  // test@afterschool.com
```

### Fixtures Directory

Place test assets in `tests/fixtures/`:

```
tests/fixtures/
├── images/
│   ├── small-image.jpg
│   └── large-image.jpg
└── data/
    └── test-payload.json
```

### Test-specific Data

```typescript
// Create isolated test data
const testStudent = {
  name: `Test Student ${Date.now()}`,  // Unique name
  grade: 3,
  schoolName: 'Test School',
};

// Clean up after test
test.afterEach(async ({ page }) => {
  await page.request.delete(`/api/students/${testStudent.id}`);
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run dev &
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting Common Issues

### Port Already in Use

```bash
# Kill existing dev server
pkill -f "next dev"

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Issues

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Reset test database
npx prisma db push
npm run seed
```

### Browser/Chromium Issues

```bash
# Reinstall Playwright browsers
npx playwright install --force

# Update Playwright
npm install -D @playwright/test@latest
```

### Slow Tests

```bash
# Run tests in parallel (default)
npm run test:e2e

# Run tests serially (for debugging)
npm run test:e2e -- --workers=1

# Run specific test file
npm run test:e2e -- student.spec.ts
```

---

## Coverage Goals

### Current Status (Phase 28-04)

| Module | Coverage | Goal |
|--------|----------|------|
| Authentication | 80% | ✓ Met |
| Analysis | 14% | 50% |
| Admin & Settings | 0% | 50% |
| Student Management | 0% | 70% |
| Counseling | 14% | 60% |
| Matching | 0% | 50% |

### Priority Improvements

1. **High Priority:**
   - Add data-testid to Admin pages (12 tests failing)
   - Fix student detail selectors (5 tests failing)
   - Add test data seeding for consistent state

2. **Medium Priority:**
   - Increase timeout for complex analysis tests
   - Implement counseling calendar selectors
   - Add matching UI testability

3. **Low Priority:**
   - Visual regression tests
   - Performance benchmarks
   - Accessibility tests

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selector Guides](https://playwright.dev/docs/selectors)
- [Test Report](../.planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md)

---

## Changelog

- **2026-02-07:** Initial guide created (Phase 28-04)
- E2E test coverage baseline: 18/87 tests passing (20.7%)
- Auth module achieving 80% pass rate
