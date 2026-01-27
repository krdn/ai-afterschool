# Phase 1: User Setup Required

**Generated:** 2026-01-28
**Phase:** 01-foundation-authentication
**Status:** Incomplete

Complete these items for the integration to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `RESEND_API_KEY` | Resend Dashboard (https://resend.com/api-keys) → Create API Key | `.env.local` |

## Dashboard Configuration

- [ ] **도메인 인증 (선택, 프로덕션용)**
  - Location: Resend Dashboard → Domains → Add Domain

## Verification

After completing setup, verify with:

```bash
# Check env var is set
grep RESEND_API_KEY .env.local

# Ensure build still passes
npm run build
```

Expected results:
- RESEND_API_KEY is present in .env.local
- Build succeeds without errors

---

**Once all items complete:** Mark status as "Complete" at top of file.
