# E2E Test Coverage Report

**Generated:** 2026-02-07
**Phase:** 28-04 Full Test Suite Verification

---

## Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | 87 |
| Passed | 18 (20.7%) |
| Failed | 58 (66.7%) |
| Skipped | 4 (4.6%) |
| Duration | 3.6 minutes |
| Excluded | 37 (auto_generated) |

---

## Coverage by Module

| Module | Tests | Passed | Failed | Coverage |
|--------|-------|--------|--------|----------|
| Authentication | 10 | 8 | 2 | 80% |
| Analysis | 7 | 1 | 6 | 14% |
| Admin & Settings | 12 | 0 | 12 | 0% |
| Student Management | 5 | 0 | 5 | 0% |
| Counseling | 7 | 1 | 6 | 14% |
| Matching | 6 | 0 | 6 | 0% |
| Performance | 4 | 0 | 4 | 0% |
| Report & Utility | 7 | 0 | 7 | 0% |
| Teacher Management | 14 | 0 | 14 | 0% |
| Auth Security | 15 | 8 | 7 | 53% |

---

## Passed Tests (18)

### Authentication (8 tests)
- ✓ AUTH-01: Teacher Registration - should successfully register a new teacher account
- ✓ AUTH-01: Teacher Registration - should show validation error for invalid email
- ✓ AUTH-02: Login and Session Persistence - should redirect to login when accessing protected route without auth
- ✓ AUTH-02: Login and Session Persistence - should show error for invalid credentials
- ✓ AUTH-02: Login and Session Persistence - should successfully login and maintain session
- ✓ AUTH-03: Password Reset - should successfully request password reset
- ✓ AUTH-03: Password Reset - should reject expired or invalid reset token
- ✓ AUTH-04: RBAC - should prevent regular teacher from accessing admin pages

### Auth Security (8 tests)
- ✓ AUTH-04: RBAC - should prevent access to other team data
- ✓ AUTH: Security - should prevent SQL injection in login
- ✓ AUTH: Security - should prevent XSS in login form
- ✓ AUTH: Security - should handle concurrent login attempts
- ✓ AUTH: Security - should validate password complexity
- ✓ AUTH: Security - should lock account after failed attempts
- ✓ AUTH: Security - should enforce secure password reset flow
- ✓ AUTH: Security - should sanitize error messages

### Analysis (1 test)
- ✓ ANL-01: 사주/성명학 계산 정확성

### Counseling (1 test)
- ✓ CNS-02: 신규 상담 예약 (Flow)

---

## Failed Tests by Category

### 1. Selector/Element Not Found (35 tests)

**Common Issues:**
- Missing `data-testid` attributes on admin pages
- Text-based selectors failing (e.g., "MBTI", "관상", "사주/성명학")
- Dynamic content not properly handled

**Examples:**
- `waiting for locator('text=MBTI')`
- `waiting for locator('[data-testid="current-provider"]')`
- `waiting for locator('[data-testid="system-logs-table"]')`

**Affected Modules:**
- Admin & Settings (12 tests)
- Analysis (5 tests)
- Student Management (5 tests)
- Counseling (5 tests)
- Matching (6 tests)
- Performance (2 tests)

### 2. Timeout Errors (15 tests)

**Common Issues:**
- Page navigation timeouts (30s limit exceeded)
- Slow loading of complex pages
- Database query delays in test environment

**Examples:**
- `Test timeout of 30000ms exceeded`
- `TimeoutError: page.waitForURL: Timeout 10000ms exceeded`

**Affected Modules:**
- Analysis (4 tests)
- Counseling (3 tests)
- Performance (2 tests)
- Teacher Management (6 tests)

### 3. Missing Routes/Features (5 tests)

**Common Issues:**
- Test references routes that don't exist
- Features not yet implemented

**Examples:**
- `/api/test/reset` endpoint missing
- `/api/teams` endpoint missing
- `/team/dashboard` route missing

**Affected Modules:**
- Teacher Management (5 tests)

### 4. Authentication/Session Issues (3 tests)

**Common Issues:**
- Session persistence across tests
- Cookie handling
- Logout flow

**Examples:**
- `should allow director/admin full access` - admin login issues
- `should logout successfully and clear session` - logout flow problems

---

## Skipped Tests (4)

These tests were intentionally skipped:
- AUTH-01: Duplicate email registration (depends on prior test)
- AUTH-03: Complete password reset (email service required)
- AUTH-04: Session timeout (requires time manipulation)
- AUTH: Security: Rate limiting (requires multiple attempts)

---

## Excluded Tests (37)

**Reason:** `auto_generated/` folder contains auto-generated tests that:
1. Duplicate functionality already covered in main test files
2. Have selector/locator issues
3. Depend on features not yet implemented

**Configuration:** `testIgnore: '**/auto_generated/**/*.spec.ts'` in `playwright.config.ts`

---

## Recommendations

### Immediate Actions (Phase 28-05)

1. **Add missing data-testid attributes:**
   - Admin pages: LLM settings, usage monitoring, system logs
   - Analysis tabs: MBTI, Face Reading, Saju
   - Student detail tabs and actions
   - Counseling calendar and modals

2. **Fix authentication flow:**
   - Ensure admin login uses correct credentials
   - Fix session persistence between tests
   - Implement proper logout handling

3. **Remove/skip problematic tests:**
   - Tests referencing non-existent APIs (`/api/test/reset`)
   - Tests for unimplemented features

### Medium-term Improvements (Phase 29+)

1. **Increase timeout for complex pages:**
   ```typescript
   test.setTimeout(60000); // for analysis/dashboard tests
   ```

2. **Use explicit waits instead of timeouts:**
   ```typescript
   await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
   ```

3. **Implement test database seeding:**
   - Consistent test data setup
   - Cleanup between tests
   - Isolated test environment

### Long-term Strategy

1. **Prioritize critical user flows:**
   - Login/Logout
   - Student CRUD operations
   - Analysis execution
   - Counseling management

2. **Implement visual regression testing:**
   - Screenshot comparison
   - Layout validation
   - Responsive design verification

3. **Add API integration tests:**
   - Server Actions testing
   - API endpoint validation
   - Database interaction verification

---

## Scenario Coverage (from SCENARIOS.md)

| ID | Scenario | Test File | Status | Notes |
|----|----------|-----------|--------|-------|
| AUTH-01 | Teacher Registration | auth.spec.ts | ✓ Partial | Basic flow works, edge cases failing |
| AUTH-02 | Login & Session | auth.spec.ts | ✓ Partial | Login works, session persistence issues |
| AUTH-03 | Password Reset | auth.spec.ts | ⚠️ Skipped | Email service required |
| AUTH-04 | RBAC | auth.spec.ts | ✓ Partial | Basic RBAC works, admin access issues |
| STU-01 | New Student | student.spec.ts | ✗ Failed | Selector issues |
| STU-02 | Student List | student.spec.ts | ✗ Failed | Selector issues |
| STU-03 | Student Detail | student.spec.ts | ✗ Failed | Selector issues |
| STU-04 | Student Delete | student.spec.ts | ✗ Failed | Selector issues |
| ANL-01 | Saju/Name Analysis | analysis.spec.ts | ✓ Passed | Calculation accuracy verified |
| ANL-02 | Face Reading | analysis.spec.ts | ✗ Failed | Selector/timing issues |
| ANL-03 | MBTI Analysis | analysis.spec.ts | ✗ Failed | Selector/timing issues |
| CNS-01 | Counseling Calendar | counseling.spec.ts | ✗ Failed | Selector issues |
| CNS-02 | New Reservation | counseling.spec.ts | ✓ Passed | Flow works end-to-end |
| CNS-03 | Complete Session | counseling.spec.ts | ✗ Failed | Selector issues |
| CNS-04 | Follow-up | counseling.spec.ts | ✗ Failed | Selector issues |
| MAT-01 | Compatibility Score | matching.spec.ts | ✗ Failed | Selector issues |
| MAT-02 | Auto Assignment | matching.spec.ts | ✗ Failed | Selector issues |
| MAT-03 | Apply Assignment | matching.spec.ts | ✗ Failed | Selector issues |
| TCH-01 | Teacher Team/Role | teacher.spec.ts | ✗ Failed | Missing APIs |
| TCH-02 | Teacher Profile | teacher.spec.ts | ✗ Failed | Selector issues |
| TCH-03 | Teacher Analysis | teacher.spec.ts | ✗ Failed | Selector issues |

**Legend:** ✓ Passed, ⚠️ Skipped, ✗ Failed, Partial

---

## Conclusion

**Current Status:** 20.7% pass rate (18/87 tests)

**Key Achievement:** Core authentication flow is working (80% pass rate for auth module)

**Main Blocker:** Missing data-testid attributes across admin, student, and counseling pages

**Next Steps:** Focus on adding testability attributes to critical user-facing pages before expanding test coverage.
