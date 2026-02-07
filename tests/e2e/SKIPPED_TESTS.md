# Skipped Tests Documentation

This document tracks all tests that are currently skipped with `test.skip` and explains why.

## auth.spec.ts

### 1. "should prevent duplicate email registration" (Line 73)
**Status:** Skipped
**Reason:** Requires email uniqueness validation to be fully implemented and tested
**Notes:** This test would verify that the same email cannot be registered twice. To enable this test:
- Ensure email uniqueness constraint exists in the database schema
- Verify the registration API returns proper error for duplicate emails
- Check that the frontend displays the error message correctly

### 2. "should complete password reset with valid token" (Line 200)
**Status:** Skipped
**Reason:** Password reset functionality requires email service integration
**Notes:** This test requires:
- Email service to be configured (RESEND_API_KEY)
- Valid reset token generation mechanism
- Password reset token validation endpoint
- In test environment, tokens would need to be mocked or retrieved from test email service

### 3. "should enforce session timeout after inactivity" (Line 317)
**Status:** Skipped
**Reason:** Session timeout configuration and testing requires environment setup
**Notes:** To enable this test:
- Session timeout duration must be configured in Next.js auth
- Test needs to simulate inactivity period (may need time manipulation)
- Session expiration handling must be implemented

### 4. "should rate-limit login attempts" (Line 380)
**Status:** Skipped
**Reason:** Rate limiting implementation not yet verified
**Notes:** To enable this test:
- Rate limiting middleware or service must be implemented
- Rate limit threshold must be configurable
- Test must allow sufficient time between runs (to avoid affecting other tests)

## Plan to Re-enable

1. **High Priority:** "should prevent duplicate email registration"
   - Blocker: None (likely just needs validation implementation)
   - Action: Verify schema constraint exists and API returns proper error

2. **Medium Priority:** "should complete password reset with valid token"
   - Blocker: Email service configuration
   - Action: Configure RESEND_API_KEY or mock email service in tests

3. **Low Priority:** Session timeout and rate limiting tests
   - Blocker: Feature implementation and test environment setup
   - Action: Implement features and configure test environment

## Notes

- Tests should be re-enabled one at a time after fixing the underlying issues
- Each re-enabled test should be verified to pass consistently
- Test isolation is important - rate limiting tests especially need cleanup
