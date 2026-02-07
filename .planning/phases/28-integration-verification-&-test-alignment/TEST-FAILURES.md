# Test Failure Analysis - Phase 28-01

**Date:** 2026-02-07
**Test Run:** Initial E2E test suite execution
**Total Tests:** 120
**Failed:** 71
**Passed:** 49 (implied)

## Summary

The initial E2E test run revealed 71 failing tests across 9 test files. The failures are concentrated in specific categories that can be addressed systematically.

## By Category

| Category | Count | Description | Priority |
|----------|-------|-------------|----------|
| **Login/Auth Issues** | ~25 | Login redirects failing, session not persisting | HIGH |
| **Selector Issues** | ~18 | Elements not found (data-testid missing/incorrect) | HIGH |
| **Timeout Issues** | ~15 | Elements not loading within timeout period | MEDIUM |
| **API Response Issues** | ~8 | API returning HTML instead of JSON (404s) | MEDIUM |
| **Navigation Issues** | ~5 | Page transitions not completing | LOW |

## Detailed Breakdown

### 1. Login/Auth Issues (HIGH Priority - ~25 tests)

**Symptom:** `TimeoutError: page.waitForURL: Timeout 10000ms exceeded` during login

**Tests Affected:**
- `auth.spec.ts`: Login flow tests
- `counseling.spec.ts`: Tests requiring teacher login
- `teacher.spec.ts`: Tests requiring admin/teacher login
- `analysis.spec.ts`: Tests requiring authentication

**Root Cause:** Login form submission not redirecting properly, or session cookies not being set correctly.

**Example Error:**
```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation until "load"
at ../utils/auth.ts:19
await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
```

**Fix Actions:**
1. Verify login form action handler is working
2. Check session cookie configuration in middleware
3. Ensure redirect after login is functioning
4. Verify DATABASE_URL is correct for user authentication

### 2. Selector Issues (HIGH Priority - ~18 tests)

**Symptom:** `Error: element(s) not found` or `Error: expect(locator).toBeVisible() failed`

**Tests Affected:**
- `admin.spec.ts`: Missing data-testid on admin elements
- `student.spec.ts`: Missing data-testid on student forms
- `teacher.spec.ts`: Missing `select[name="role"]` selector
- `analysis.spec.ts`: Missing `[data-testid="student-dashboard"]`

**Example Errors:**
```
Error: element(s) not found
- Expect "toBeVisible" with timeout 5000ms
Locator: locator('h1')
Expected: > 0
Received: 0

Error: page.selectOption: Test timeout of 60000ms exceeded.
- waiting for locator('select[name="role"]')
```

**Fix Actions:**
1. Add missing data-testid attributes to admin page elements
2. Verify student/teacher form selectors exist
3. Add data-testid to dashboard components
4. Run grep to find all used selectors in tests and verify they exist in code

### 3. Timeout Issues (MEDIUM Priority - ~15 tests)

**Symptom:** `Test timeout of 60000ms exceeded` during element interaction

**Tests Affected:**
- `admin.spec.ts`: Admin settings page loading
- `counseling.spec.ts`: Counseling form interactions
- `report.spec.ts`: Report generation

**Root Cause:** Pages loading slowly, or elements not becoming interactive in time.

**Fix Actions:**
1. Increase timeout for slow-loading pages
2. Add explicit waits for critical elements
3. Optimize page loading performance
4. Check for JavaScript errors in browser console

### 4. API Response Issues (MEDIUM Priority - ~8 tests)

**Symptom:** `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Tests Affected:**
- `teacher.spec.ts`: `/api/teachers?email=...` returning HTML (404 page)

**Root Cause:** API endpoints returning 404 HTML pages instead of JSON errors.

**Example Error:**
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
const otherTeacherData = await otherTeacherResponse.json();
```

**Fix Actions:**
1. Verify API routes exist and are registered
2. Ensure API routes return JSON even for errors
3. Check API route file paths match expected URLs

### 5. Navigation Issues (LOW Priority - ~5 tests)

**Symptom:** Navigation to specific pages not completing

**Tests Affected:**
- `counseling.spec.ts`: Navigation to `/counseling/new` failing
- `student.spec.ts`: Navigation to student detail pages not matching pattern

**Example Error:**
```
Error: expect(page).toHaveURL(expected) failed
Expected pattern: /\/students\/[a-zA-Z0-9-]+/
Received string: "http://localhost:3000/students"
```

**Fix Actions:**
1. Verify routes exist in Next.js app directory
2. Check for client-side redirect logic issues
3. Ensure dynamic route parameters are correct

## By Test File

| Test File | Failures | Primary Issues |
|-----------|----------|----------------|
| `admin.spec.ts` | 82 | Selector + Timeout |
| `teacher.spec.ts` | 33 | Selector + API |
| `counseling.spec.ts` | 23 | Login + Navigation |
| `matching.spec.ts` | 21 | Login + Selector |
| `report.spec.ts` | 17 | Timeout + Selector |
| `performance.spec.ts` | 14 | Login + Timeout |
| `analysis.spec.ts` | 14 | Login + Selector |
| `auth.spec.ts` | 8 | Login flow |
| `student.spec.ts` | 7 | Selector + Navigation |
| Generated tests (STU-01, etc.) | ~30 | Various |

## Recommended Fix Order

### Phase 1: Critical Infrastructure (Fix login first)
1. **Fix login/auth flow** - This is blocking 25+ tests
   - Verify login form submission
   - Check session cookie configuration
   - Test login redirects manually

### Phase 2: Selector Infrastructure (Add missing testids)
2. **Add missing data-testid attributes** - Fixes 18+ selector issues
   - Admin page elements
   - Form elements (role select, name input)
   - Dashboard components
   - Student/teacher detail pages

### Phase 3: API Routes (Fix 404s)
3. **Verify API endpoints exist** - Fixes 8+ API issues
   - `/api/teachers` endpoint
   - Any other 404ing API routes

### Phase 4: Navigation & Timeouts (Polish)
4. **Fix navigation issues** - Fixes 5+ tests
   - Verify dynamic routes
   - Check redirect logic

5. **Increase timeouts where needed** - Optional polish
   - Add explicit waits for slow elements

## Test Environment Notes

- **Playwright Version:** 1.58.1
- **Browser:** Chromium
- **Base URL:** http://localhost:3000
- **Database:** PostgreSQL on port 5436
- **Test Timeout:** 60000ms (60s)

## Next Steps

1. Run tests with `--headed` flag to visually debug login issues
2. Add more detailed logging to auth utility functions
3. Create a checklist of required data-testid attributes
4. Fix API routes returning HTML instead of JSON
5. Re-run tests after each fix category to validate progress
