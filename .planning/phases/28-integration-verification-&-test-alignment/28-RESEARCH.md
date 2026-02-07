# Phase 28: Integration Verification & Test Alignment - Research

**Date:** 2026-02-07
**Phase Goal:** 통합 검증 및 테스트 수정 (전체 E2E 실행, 남은 셀렉터 수정)
**Success Criteria:** 전체 E2E 테스트 스위트가 실행되어 74건 실패가 0건으로 해소

---

## 1. Current E2E Test Status

### Test Files (9 spec files)
```
tests/e2e/
├── admin.spec.ts       (12 tests)
├── analysis.spec.ts    (8 tests)
├── auth.spec.ts        (16 tests)
├── counseling.spec.ts
├── matching.spec.ts
├── performance.spec.ts
├── report.spec.ts
├── student.spec.ts     (6 tests)
└── teacher.spec.ts
```

### Test Infrastructure
- **Test Runner:** Playwright v1.58.1
- **Base URL:** http://localhost:3000
- **Config:** playwright.config.ts (chromium only, HTML reporter)
- **Test Utils:** tests/utils/auth.ts, tests/utils/selectors.ts

### Test Commands
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e -- --list    # List all tests
npm run test:e2e -- --ui      # Run with UI mode
npm run test:e2e -- --debug   # Debug mode
```

---

## 2. Common Test Failure Patterns

### Selector-Related Failures
1. **Missing data-testid attributes** - Tests expect specific test IDs that don't exist
2. **Selector changes** - UI structure changed but tests not updated
3. **Timing issues** - Elements not ready when test tries to interact
4. **Dynamic content** - Lists/tables with conditional rendering

### Authentication Issues
1. **Session cookie** - Tests expect `session` cookie but may not be set
2. **Login redirect loops** - Protected routes not properly redirecting
3. **Test account setup** - Test accounts don't exist in database

### Environment Setup
1. **Dev server not running** - Tests need http://localhost:3000
2. **Database not seeded** - Tests expect specific data
3. **Missing fixtures** - Test images/files not available

---

## 3. Selector Strategy Analysis

### Current Selector Patterns (from tests/utils/selectors.ts)

| Pattern | Example | Stability |
|---------|---------|-----------|
| `input[name="email"]` | Form inputs | High |
| `[data-testid="student-card"]` | Component test IDs | Very High |
| `button:has-text("로그인")` | Text-based buttons | Medium |
| `a[href="/students"]` | Link navigation | High |

### Missing data-testid Coverage
Based on Phase 23 (data-testid Infrastructure) - 37 attributes added, but gaps remain:

**Likely Missing Areas:**
1. Student detail tabs (learning, analysis, matching, counseling)
2. Admin sub-pages (llm-settings, system-status, system-logs, etc.)
3. Counseling calendar and modals
4. Matching algorithm results
5. Report generation buttons

---

## 4. Running E2E Tests

### Prerequisites
```bash
# 1. Start dev server (required - webServer disabled in config)
npm run dev &

# 2. Ensure database has test data
# (uses existing seed data or test fixtures)

# 3. Run tests
npm run test:e2e
```

### Interpretation of Results
```bash
# Expected output format:
Running 74 tests using 1 worker

[chromium] › auth.spec.ts:23:9 › AUTH-01: Teacher Registration › should register (3.2s)
[chromium] › student.spec.ts:26:7 › STU-01 › 신규 학생 등록 FAILED
  Error: locator.click: Target closed

74 failed
[chromium]  playwright-report/index.html
```

---

## 5. Test Environment Requirements

### Database State
- Test accounts: admin@test.com, teacher1@test.com, teacher2@test.com
- Sample students for CRUD operations
- Existing analysis data for history tests

### External Services (Mocked)
- Cloudinary (image upload) - may need mocking
- Claude Vision API (face/palm analysis) - skip or mock
- Email service (Resend) - not tested

### Browser Context
- Chromium (Desktop Chrome device)
- httpOnly session cookies
- LocalStorage for some auth tokens

---

## 6. Areas Likely Needing Selector Fixes

### High Priority (from recent phases)
1. **Phase 24 routes** - New admin pages likely missing test IDs
2. **Phase 25 tabs** - Student analysis sub-tabs may need selectors
3. **Phase 26 UI** - Counseling/matching components
4. **Phase 27 auth** - Error pages (404, 403, 500) need test IDs

### Selector Fix Strategy
```typescript
// Add to components missing data-testid:
<Button data-testid="delete-student-button">삭제</Button>
<Tabs data-testid="student-detail-tabs">
  <TabsList>
    <TabsTrigger value="analysis" data-tab="analysis">분석</TabsTrigger>
```

---

## 7. Verification Approach

### Step 1: Dry Run
```bash
npm run test:e2e -- --dry-run  # List tests without running
```

### Step 2: Categorized Run
```bash
# Run by spec file to isolate failures
npm run test:e2e -- auth.spec.ts
npm run test:e2e -- student.spec.ts
```

### Step 3: Fix & Verify Cycle
1. Run tests → capture failures
2. Categorize by root cause (selector vs logic vs environment)
3. Fix in priority order (selector first)
4. Re-run until all pass

### Step 4: Full Suite Verification
```bash
npm run test:e2e -- --reporter=html
# Open playwright-report/index.html for detailed results
```

---

## 8. Estimated Work

Based on similar projects:
- **Initial test run:** 15-30 min (identify all failures)
- **Selector fixes:** 2-4 hours (estimated 30-50 components)
- **Logic fixes:** 1-2 hours (if needed)
- **Final verification:** 30 min

**Total:** 4-7 hours for complete fix

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests require running server | High | Ensure dev server started first |
| Database seed mismatch | Medium | Use dedicated test seed script |
| Flaky tests (timing) | Low | Add waitFor() where needed |
| Auth token changes | Medium | Update auth.ts helpers |

---

## 10. Recommended Execution Plan

### Wave 1: Infrastructure Setup
- Ensure test environment ready
- Run initial test suite
- Document all failures

### Wave 2: Systematic Fixes
- Fix missing data-testid attributes
- Update selectors in test files
- Handle timing/async issues

### Wave 3: Verification
- Full test suite run
- All 74 tests passing
- Documentation update
