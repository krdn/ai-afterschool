# Phase 2: File Infrastructure - Research

**Researched:** 2026-01-28
**Domain:** Next.js App Router file uploads, image processing, storage
**Confidence:** MEDIUM

## Summary

This phase requires a safe upload pipeline that accepts JPG/PNG/HEIC, stores originals and square-cropped derivatives, and exposes images in student detail/edit/create flows. The existing app uses Next.js App Router, Prisma, and Server Actions with FormData, so the standard approach is a Route Handler upload endpoint (or Server Action with body size tuning), Sharp for server-side resizing, and a dedicated StudentImage table keyed by studentId+type to enforce the single-slot rule.

Official Next.js docs confirm `request.formData()` in App Router Route Handlers and the 1MB default body limit for Server Actions. Sharp documentation provides the square-crop (`fit: cover`) resize pattern and buffer output for storage. Next/Image documentation defines remotePatterns requirements for external image URLs.

**Primary recommendation:** Use a Node.js Route Handler to accept `FormData` uploads, validate type/size, generate square crops with Sharp, store original + resized files, and persist metadata in a `StudentImage` table with ownership checks in server actions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 15.5.10 | Upload endpoints via Route Handlers | Built-in Request/FormData API support in App Router |
| Prisma | 7.3.0 | Store image metadata (urls, type, sizes) | Existing data layer and ownership checks |
| sharp | 0.34.x | Square crop + resize to buffers/files | Fast, server-side image processing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/image | bundled | Display optimized images | Required for responsive image rendering and optimization |
| zod | 4.3.6 | Validate non-file fields | Existing validation pattern in server actions |
| fs/promises (Node) | built-in | Write original + resized files | Local filesystem storage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local filesystem + sharp | Vercel Blob | Simplifies storage/CDN but Vercel Functions have 4.5MB request body limit for server uploads |
| Local filesystem + sharp | S3-compatible storage | More setup but durable, scalable storage |
| Sharp server-side resize | Cloudinary transformations | Offloads processing but introduces external dependency |

**Installation:**
```bash
npm install sharp
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── students/
│           └── [studentId]/
│               └── images/
│                   └── route.ts   # Upload/delete images (nodejs runtime)
├── lib/
│   ├── actions/
│   │   └── student-images.ts       # ownership checks + db updates
│   ├── images/
│   │   ├── process-image.ts        # sharp resize helpers
│   │   └── storage.ts              # local fs paths + IO
│   └── validations/
│       └── student-images.ts       # zod schema for metadata fields
└── prisma/
    └── schema.prisma               # StudentImage model + type enum
```

### Pattern 1: Route Handler Upload with FormData
**What:** Use `request.formData()` in an App Router Route Handler to read `File` objects.
**When to use:** File upload (images) to avoid Server Actions 1MB default body limit.
**Example:**
```ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })
  // validate file.type, file.size
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  // process + store
  return Response.json({ ok: true })
}
```

### Pattern 2: Square Crop with Sharp
**What:** Resize to square using `fit: cover` to enforce uniform thumbnails.
**When to use:** Profile/face/palm images require same crop behavior.
**Example:**
```ts
// Source: https://github.com/lovell/sharp/blob/main/docs/src/content/docs/api-resize.md
import sharp from 'sharp'

const squareBuffer = await sharp(inputBuffer)
  .resize({ width: 512, height: 512, fit: sharp.fit.cover })
  .toBuffer()
```

### Pattern 3: Image Rendering with Next/Image
**What:** Use `next/image` with `remotePatterns` if URLs are external.
**When to use:** Student detail tabs and summary thumbnails.
**Example:**
```js
// Source: https://nextjs.org/docs/app/api-reference/components/image
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.example.com',
        pathname: '/students/**',
      },
    ],
  },
}
```

### Anti-Patterns to Avoid
- **Server Actions for large file uploads:** default 1MB body size limit will fail unless configured.
- **Edge runtime for sharp:** Sharp requires Node.js runtime, not edge.
- **Public path name collisions:** storing raw filenames without unique IDs causes overwrites.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image resizing/cropping | Custom canvas or manual pixel ops | `sharp` | Mature, fast, handles metadata and formats |
| Multipart parsing | Manual boundary parsing | `request.formData()` | Native Web API in App Router |
| Image optimization | Custom `img` tags everywhere | `next/image` | Built-in optimization and layout safety |

**Key insight:** File upload edge cases (size limits, formats, orientation) are best handled by proven libraries and platform APIs.

## Common Pitfalls

### Pitfall 1: Server Action body size limit
**What goes wrong:** Upload fails or truncates at ~1MB.
**Why it happens:** Next.js Server Actions default body size limit is 1MB.
**How to avoid:** Use Route Handlers for uploads or set `experimental.serverActions.bodySizeLimit`.
**Warning signs:** 413 errors or missing file data.

### Pitfall 2: HEIC support missing in runtime
**What goes wrong:** HEIC upload fails during processing.
**Why it happens:** HEIF/HEIC support depends on libvips build in Sharp.
**How to avoid:** Validate HEIC support in deployment or convert via a service that supports HEIC.
**Warning signs:** Sharp errors when decoding HEIC.

### Pitfall 3: External images blocked by Next/Image
**What goes wrong:** Next/Image returns 400 when rendering stored URLs.
**Why it happens:** `remotePatterns` not configured in `next.config.js`.
**How to avoid:** Add exact hostname/path patterns for uploaded URLs.
**Warning signs:** 400 responses for `/_next/image` URLs.

## Code Examples

Verified patterns from official sources:

### Read FormData in Route Handler
```ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
export async function POST(request: Request) {
  const formData = await request.formData()
  const name = formData.get('name')
  return Response.json({ name })
}
```

### Sharp Buffer Output
```js
// Source: https://github.com/lovell/sharp/blob/main/docs/src/content/docs/api-output.md
const data = await sharp(input).toBuffer()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes + multer | App Router Route Handlers + `request.formData()` | Next.js 13.2 | Native Web APIs, less custom parsing |
| Unbounded uploads in Server Actions | Server Actions body size limits | Next.js 14+ | Must configure or use route handlers |

**Deprecated/outdated:**
- `images.domains` in Next.js config: replaced by strict `remotePatterns`.

## Open Questions

1. **Storage target (local vs external)**
   - What we know: Local filesystem is simplest for a Docker-hosted app.
   - What's unclear: Production environment persistence and CDN needs.
   - Recommendation: Choose local storage now, document migration path to Blob/S3 if deployment changes.

2. **HEIC decoding support**
   - What we know: Sharp HEIF/HEIC support depends on libvips build.
   - What's unclear: Whether the deployment image includes HEIF support.
   - Recommendation: Verify HEIC processing in the target runtime; otherwise convert client-side or use external service.

3. **Max upload size**
   - What we know: Server Actions default limit is 1MB; Vercel server uploads 4.5MB.
   - What's unclear: Expected max size for student photos.
   - Recommendation: Define size cap (e.g., 5MB) and enforce validation + config accordingly.

## Sources

### Primary (HIGH confidence)
- /vercel/next.js - Route Handlers `request.formData()` and Server Actions body size limit
- /lovell/sharp - resize `fit: cover`, `toBuffer()`, metadata APIs
- https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions
- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://nextjs.org/docs/app/api-reference/components/image
- https://sharp.pixelplumbing.com/api-resize/
- https://github.com/lovell/sharp/blob/main/docs/src/content/docs/api-output.md

### Secondary (MEDIUM confidence)
- https://vercel.com/docs/storage/vercel-blob/server-upload

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - storage target still open, sharp validated
- Architecture: MEDIUM - patterns depend on storage choice
- Pitfalls: HIGH - supported by official docs and known limits

**Research date:** 2026-01-28
**Valid until:** 2026-02-27
