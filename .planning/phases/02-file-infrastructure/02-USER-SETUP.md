# Phase 2: User Setup Required

**Generated:** 2026-01-28
**Phase:** 02-file-infrastructure
**Status:** Incomplete

Complete these items for the Cloudinary integration to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → Product Environment | `.env.local` |
| [ ] | `CLOUDINARY_API_KEY` | Cloudinary Dashboard → Product Environment | `.env.local` |
| [ ] | `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → Product Environment | `.env.local` |

## Account Setup

- [ ] **Create Cloudinary account** (if needed)
  - URL: https://cloudinary.com/users/register/free
  - Skip if: Already have a Cloudinary account

## Verification

After completing setup, verify with:

```bash
grep CLOUDINARY .env.local
```

Expected results:
- All three Cloudinary variables are present and non-empty.

---

**Once all items complete:** Mark status as "Complete" at top of file.
