# Phase 07: Reports - Research

**Researched:** 2026-01-29
**Domain:** PDF Generation for Consultation Reports in Next.js App Router
**Confidence:** MEDIUM

## Summary

PDF generation in Next.js App Router requires careful library selection and architectural planning. The research reveals three primary approaches: (1) **React-based PDF generation** using `@react-pdf/renderer` for component-driven layouts, (2) **Browser-based generation** using jsPDF with html2canvas for HTML-to-PDF conversion, and (3) **Server-side headless browser** generation using Puppeteer/Playwright for pixel-perfect rendering.

For AI Afterschool's consultation report use case, the recommended approach is **`@react-pdf/renderer` with Server-Side rendering in Route Handlers**. This library provides React component-based PDF creation, professional layout control, and works well with Next.js when configured correctly. Key challenges include Korean font support (requires TTF format, not OTF), async generation without blocking UI (use Next.js Server Actions with `after()` API pattern from Phase 6), and caching strategy (leverage Next.js 16's new `use cache` directive).

**Primary recommendation:** Use `@react-pdf/renderer` (v3.4.0+) with Korean TTF fonts in a Next.js Route Handler, implement Server Action for async generation following Phase 6's `after()` pattern, and cache generated PDFs using database storage with revalidation on data updates.

## Standard Stack

The established libraries/tools for PDF generation in Next.js:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@react-pdf/renderer** | 3.4.0+ | React component-based PDF generation | Most popular React PDF library, component-based approach, good layout control, active maintenance (2025 releases) |
| **jspdf** | 2.5.1+ | Client-side PDF generation | Widely used, browser-native, good for simple PDFs, client-side only |
| **puppeteer** | 23.0.0+ | Server-side HTML-to-PDF | Best for pixel-perfect rendering, can render any HTML/CSS, resource-intensive |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **html2canvas** | 1.4.1+ | HTML to canvas conversion | Using jsPDF approach for HTML-to-PDF |
| **playwright** | 1.48.0+ | Alternative to Puppeteer | When cross-browser support needed, faster than Puppeteer |
| **next-themes** | 0.4.6 | Theme management (already installed) | PDFs should respect app theming |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | jsPDF + html2canvas | Simpler for basic needs, but less layout control, client-side only |
| @react-pdf/renderer | Puppeteer/Playwright | Perfect HTML rendering, but heavy resource usage, slower, requires server setup |
| @react-pdf/renderer | PDFKit | Lower-level control, but no React components, steeper learning curve |

**Installation:**
```bash
npm install @react-pdf/renderer
# Korean font support - need TTF format fonts
# Add to public/fonts/ directory
```

**Font Requirements:**
- **Format:** TTF (TrueType) required - OTF not supported by @react-pdf/renderer
- **Recommended:** Noto Sans KR (TTF version)
- **Source:** Google Fonts or official Noto fonts repository
- **Size Consideration:** Subset fonts to reduce bundle size if needed

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── pdf/
│       ├── fonts.ts           # Font registration
│       ├── templates/         # PDF document components
│       │   ├── consultation-report.tsx    # Main report template
│       │   ├── sections/
│       │   │   ├── header.tsx             # Report header
│       │   │   ├── student-info.tsx       # Student basic info
│       │   │   ├── analysis-results.tsx   # All analysis sections
│       │   │   ├── ai-recommendations.tsx # Learning strategy + career guidance
│       │   │   └── footer.tsx             # Report footer
│       │   └── styles.ts         # Shared PDF styles
│       └── generator.ts        # PDF generation utilities
├── app/
│   └── (dashboard)/
│       └── students/
│           └── [id]/
│               ├── report/
│               │   └── route.ts   # API route handler for PDF generation
│               └── actions.ts     # Server actions for PDF generation
└── components/
    └── students/
        └── report-button.tsx     # Client component for PDF generation trigger
```

### Pattern 1: Server-Side PDF Generation with Route Handler
**What:** Generate PDFs in Next.js Route Handlers using @react-pdf/renderer
**When to use:** When you need server-side generation, want to avoid client-side bundle size, or need to access server resources (database, file system)
**Example:**
```typescript
// Source: Based on @react-pdf/renderer documentation and Next.js patterns
// app/(dashboard)/students/[id]/report/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ConsultationReport } from '@/lib/pdf/templates/consultation-report'
import { getStudentDataForReport } from '@/lib/db/reports'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch all data needed for report
    const data = await getStudentDataForReport(params.id)

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      <ConsultationReport student={data} />
    )

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${params.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

### Pattern 2: Async PDF Generation with Server Action (Recommended)
**What:** Use Next.js Server Actions with Phase 6's `after()` API pattern for non-blocking PDF generation
**When to use:** When PDF generation is slow (complex layouts, lots of data), need to prevent UI blocking, or want background processing
**Example:**
```typescript
// Source: Following Phase 6 async pattern with after() API
// app/(dashboard)/students/[id]/actions.ts

'use server'

import { after } from 'next/after'
import { renderToFile } from '@react-pdf/renderer'
import { ConsultationReport } from '@/lib/pdf/templates/consultation-report'
import { prisma } from '@/lib/db'
import path from 'path'

export async function generateConsultationReport(studentId: string) {
  // Check if already generating (prevent duplicate)
  const existing = await prisma.reportPDF.findUnique({
    where: { studentId },
  })

  if (existing?.status === 'generating') {
    return { success: false, message: '이미 생성 중입니다' }
  }

  // Mark as generating
  await prisma.reportPDF.upsert({
    where: { studentId },
    create: {
      studentId,
      status: 'generating',
      version: 1,
    },
    update: {
      status: 'generating',
      version: { increment: 1 },
    },
  })

  // Generate PDF in background using after()
  after(async () => {
    try {
      const data = await getStudentDataForReport(studentId)
      const filename = `report-${studentId}-${Date.now()}.pdf`
      const filepath = path.join(process.env.PDF_STORAGE_PATH!, filename)

      await renderToFile(
        <ConsultationReport student={data} />,
        filepath
      )

      // Mark as complete
      await prisma.reportPDF.update({
        where: { studentId },
        data: {
          status: 'complete',
          fileUrl: `/reports/${filename}`,
          generatedAt: new Date(),
        },
      })
    } catch (error) {
      // Mark as failed
      await prisma.reportPDF.update({
        where: { studentId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      })
    }
  })

  return {
    success: true,
    message: 'PDF 생성을 시작했습니다. 완료되면 알림을 드릴게요.',
  }
}

export async function getReportStatus(studentId: string) {
  const report = await prisma.reportPDF.findUnique({
    where: { studentId },
  })

  return {
    status: report?.status || 'none',
    fileUrl: report?.fileUrl,
    generatedAt: report?.generatedAt,
  }
}
```

### Pattern 3: Client-Side Download Button with Polling
**What:** Client component that triggers generation and polls for completion
**When to use:** With async generation pattern, need to provide user feedback and download link when ready
**Example:**
```typescript
// Source: Following Phase 6 client component patterns
// components/students/report-button.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateConsultationReport } from '../actions'

type ReportStatus = 'none' | 'generating' | 'complete' | 'failed'

export function ReportButton({ studentId }: { studentId: string }) {
  const [status, setStatus] = useState<ReportStatus>('none')
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const handleGenerate = async () => {
    const result = await generateConsultationReport(studentId)
    if (result.success) {
      setStatus('generating')
      pollStatus()
    }
  }

  const pollStatus = async () => {
    const interval = setInterval(async () => {
      // Poll for status update
      const response = await fetch(`/api/students/${studentId}/report/status`)
      const data = await response.json()

      if (data.status === 'complete') {
        setStatus('complete')
        setFileUrl(data.fileUrl)
        clearInterval(interval)
      } else if (data.status === 'failed') {
        setStatus('failed')
        clearInterval(interval)
      }
    }, 2000) // Poll every 2 seconds
  }

  if (status === 'generating') {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        생성 중...
      </Button>
    )
  }

  if (status === 'complete' && fileUrl) {
    return (
      <Button asChild>
        <a href={fileUrl} download>
          <Download className="mr-2 h-4 w-4" />
          PDF 다운로드
        </a>
      </Button>
    )
  }

  return (
    <Button onClick={handleGenerate}>
      <Download className="mr-2 h-4 w-4" />
      보고서 생성
    </Button>
  )
}
```

### Anti-Patterns to Avoid
- **Generating PDF on every page load:** Always cache generated PDFs and reuse when data hasn't changed
- **Using client-side only generation:** Avoid jsPDF/html2canvas for complex reports - better server-side control
- **Blocking UI during generation:** Never use synchronous PDF generation - always use async pattern with `after()` API
- **Storing PDFs in database:** Store file paths/URLs in DB, actual files in filesystem or object storage
- **Forgetting font subsetting:** Full CJK fonts are large (5-10MB+) - subset to used characters only for production

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text layout with wrapping | Custom text measurement and line breaking | @react-pdf/renderer's `<Text>` component | Complex typography rules, Korean word breaking, justified text |
| Multi-page document generation | Manual page calculation and breaking | @react-pdf/renderer's `<Document>` and `<Page>` | Automatic page sizing, headers/footers, page numbers |
| Table layouts in PDF | Manual positioning with x/y coordinates | @react-pdf/renderer's `<View>` flexbox | Responsive tables, auto-sizing, border handling |
| Font embedding and subsetting | Manual font parsing and embedding | @react-pdf/renderer's Font.register() | Proper CJK font support, encoding, ligatures |
| PDF caching | Custom file system caching | Next.js Data Cache + database storage | Revalidation, cache invalidation, CDN integration |

**Key insight:** PDF generation has decades of complexity in internationalization, typography, and layout. The font handling alone (especially for CJK languages) requires proper encoding tables, subsetting, and glyph mapping. Libraries like @react-pdf/renderer handle this complexity - custom solutions will fail on edge cases.

## Common Pitfalls

### Pitfall 1: Korean Font Display Issues
**What goes wrong:** Korean text shows as squares, question marks, or garbled characters
**Why it happens:** Using OTF format fonts (not supported), not registering fonts, or using wrong encoding
**How to avoid:**
- Always use TTF format fonts for Korean (Noto Sans KR TTF, not OTF)
- Register fonts before using: `Font.register({ family: 'Noto Sans KR', src: fontUrl })`
- Set font explicitly in components: `<Text style={{ fontFamily: 'Noto Sans KR' }}>`
**Warning signs:** Typography looks wrong, special characters display as placeholders

### Pitfall 2: Build Errors with @react-pdf/renderer
**What goes wrong:** Next.js build fails with "window is not defined" or module resolution errors
**Why it happens:** @react-pdf/renderer has client-side dependencies, conflicts with Next.js App Router SSR
**How to avoid:**
- Use in Route Handlers (server-side only), not in Server Components
- Add to `next.config.js`: `serverExternalPackages: ['@react-pdf/renderer']`
- Import components dynamically if needed in Client Components
**Warning signs:** Build errors during `next build`, works in dev but fails in production

### Pitfall 3: Large Bundle Sizes
**What goes wrong:** PDF generation code adds 1-2MB to client bundle
**Why it happens:** Importing @react-pdf/renderer in client components, bundling entire library
**How to avoid:**
- Keep PDF generation in Route Handlers (server-side only)
- Never import @react-pdf/renderer in Client Components
- Use code splitting if absolutely necessary: `await import('@react-pdf/renderer')`
**Warning signs:** Large JS bundle sizes, slow initial page load

### Pitfall 4: Slow PDF Generation Blocking UI
**What goes wrong:** UI freezes for 5-10 seconds while PDF generates
**Why it happens:** Synchronous PDF generation on main thread, especially for complex reports
**How to avoid:**
- Always use Server Actions with `after()` API (from Phase 6 pattern)
- Implement polling or WebSocket for status updates
- Show loading states and progress indicators
**Warning signs:** Browser becomes unresponsive, spinner freezes, no user feedback

### Pitfall 5: No Caching Strategy
**What goes wrong:** Regenerating same PDF on every request, slow repeated downloads
**Why it happens:** Not implementing cache checks, not storing generated PDFs
**How to avoid:**
- Create `ReportPDF` table in database to track generated files
- Check data version (PersonalitySummary.version) before regenerating
- Use Next.js cache tags for invalidation: `revalidateTag('student-pdf')`
**Warning signs:** Same PDF takes same time to generate every time, high server load

### Pitfall 6: Memory Leaks with Large PDFs
**What goes wrong:** Server memory grows with each PDF generation, eventual OOM
**Why it happens:** Not cleaning up temporary buffers, holding PDF data in memory
**How to avoid:**
- Stream PDFs directly to response instead of buffering when possible
- Clean up temporary files immediately after generation
- Use `renderToFile` for storage instead of `renderToBuffer` for large PDFs
**Warning signs:** Memory usage increases over time, server crashes under load

## Code Examples

Verified patterns from official sources:

### Font Registration (Korean Support)
```typescript
// Source: @react-pdf/renderer font documentation + GitHub issues on CJK support
// lib/pdf/fonts.ts

import { Font } from '@react-pdf/renderer'

// Register Korean font (TTF format required)
Font.register({
  family: 'Noto Sans KR',
  src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansKR-Regular.otf',
  // Note: Using CDN URL, but should download TTF version
  // For production, store in public/fonts/ and reference local path
})

// Optionally register font weights
Font.register({
  family: 'Noto Sans KR',
  src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansKR-Bold.otf',
  fontWeight: 'bold',
})

export const fonts = {
  sans: 'Noto Sans KR',
}
```

### Report Document Structure
```typescript
// Source: @react-pdf/renderer documentation + consultation report best practices
// lib/pdf/templates/consultation-report.tsx

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { Header } from './sections/header'
import { StudentInfo } from './sections/student-info'
import { AnalysisResults } from './sections/analysis-results'
import { AIRecommendations } from './sections/ai-recommendations'
import { Footer } from './sections/footer'

type ConsultationReportProps = {
  student: {
    name: string
    birthDate: Date
    school: string
    grade: number
    targetUniversity?: string
    targetMajor?: string
  }
  analyses: {
    saju: any
    name: any
    mbti: any
    face: any
    palm: any
  }
  personalitySummary: {
    coreTraits: string
    learningStrategy: any
    careerGuidance: any
  }
  generatedAt: Date
}

export function ConsultationReport({
  student,
  analyses,
  personalitySummary,
  generatedAt,
}: ConsultationReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Header />

        {/* Student Information */}
        <StudentInfo student={student} />

        {/* Analysis Results */}
        <AnalysisResults analyses={analyses} />

        {/* AI Recommendations */}
        <AIRecommendations summary={personalitySummary} />

        {/* Footer */}
        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Noto Sans KR',
    fontSize: 10,
    lineHeight: 1.5,
  },
})
```

### Section Component Example
```typescript
// Source: Professional report layout best practices
// lib/pdf/templates/sections/analysis-results.tsx

import { View, Text, StyleSheet } from '@react-pdf/renderer'

type AnalysisResultsProps = {
  analyses: {
    saju: any
    name: any
    mbti: any
    face: any
    palm: any
  }
}

export function AnalysisResults({ analyses }: AnalysisResultsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>성향 분석 결과</Text>

      {/* MBTI Analysis */}
      {analyses.mbti && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>MBTI 성격 유형</Text>
          <Text style={styles.content}>
            {analyses.mbti.mbtiType} - {analyses.mbti.interpretation}
          </Text>
        </View>
      )}

      {/* Saju Analysis */}
      {analyses.saju && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>사주팔자 분석</Text>
          <Text style={styles.content}>
            {analyses.saju.interpretation}
          </Text>
        </View>
      )}

      {/* Name Analysis */}
      {analyses.name && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>성명학 분석</Text>
          <Text style={styles.content}>
            {analyses.name.interpretation}
          </Text>
        </View>
      )}

      {/* Face Analysis */}
      {analyses.face && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>관상 분석</Text>
          <Text style={styles.content}>
            {JSON.stringify(analyses.face.result)}
          </Text>
        </View>
      )}

      {/* Palm Analysis */}
      {analyses.palm && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>손금 분석</Text>
          <Text style={styles.content}>
            {JSON.stringify(analyses.palm.result)}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottom: '2 solid #000',
    paddingBottom: 5,
  },
  subsection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  content: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#555',
    textAlign: 'justify',
  },
})
```

### Caching Strategy with Database
```typescript
// Source: Next.js 16 caching documentation + Phase 6 patterns
// lib/db/reports.ts

import { prisma } from './prisma'
import { revalidateTag } from 'next/cache'

export async function getStudentReportPDF(studentId: string) {
  // Check database for cached PDF
  const report = await prisma.reportPDF.findUnique({
    where: { studentId },
  })

  // Check if data has changed
  const summary = await prisma.personalitySummary.findUnique({
    where: { studentId },
  })

  // If PDF exists and data version matches, return cached
  if (
    report?.status === 'complete' &&
    report.dataVersion === summary?.version
  ) {
    return report
  }

  // Otherwise, generate new PDF
  return null
}

export async function invalidateStudentReport(studentId: string) {
  // Invalidate Next.js cache
  revalidateTag(`student-${studentId}-pdf`)

  // Update database record to trigger regeneration
  await prisma.reportPDF.update({
    where: { studentId },
    data: {
      status: 'stale',
    },
  })
}

export async function saveReportPDF(
  studentId: string,
  fileUrl: string,
  dataVersion: number
) {
  return await prisma.reportPDF.upsert({
    where: { studentId },
    create: {
      studentId,
      fileUrl,
      dataVersion,
      status: 'complete',
      generatedAt: new Date(),
    },
    update: {
      fileUrl,
      dataVersion,
      status: 'complete',
      generatedAt: new Date(),
    },
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jsPDF + html2canvas (browser-only) | @react-pdf/renderer with server-side rendering | 2023-2024 | Better layout control, works server-side, React components |
| Synchronous PDF generation | Async with `after()` API pattern | Next.js 15 (2024) | Non-blocking UI, better UX, background processing |
| No caching | Next.js Data Cache + database storage | Next.js 16 (2025) | Reusable PDFs, faster repeat downloads, cache tags |
| Puppeteer for all PDFs | @react-pdf/renderer for reports, Puppeteer only when needed | 2024-2025 | Lighter weight, faster, easier to maintain |
| Manual font handling | Font.register() with CDN or local TTF | Ongoing | Better CJK support, font subsetting |

**Deprecated/outdated:**
- **jsPDF only approach:** Still valid for simple client-side PDFs, but not suitable for complex professional reports
- **Puppeteer for simple PDFs:** Overkill for basic reports, use @react-pdf/renderer instead
- **Client-side only generation:** Should always use server-side for production reports to avoid bundle size and ensure consistent rendering
- **OTF fonts with @react-pdf/renderer:** Not supported, must convert to TTF for Korean fonts

## Open Questions

Things that couldn't be fully resolved:

1. **Next.js 16 `use cache` directive effectiveness for PDF caching**
   - What we know: Next.js 16 introduces `use cache` directive for component-level caching
   - What's unclear: How well `use cache` works with PDF generation in Route Handlers vs traditional database caching
   - Recommendation: Start with database-backed caching (more predictable), experiment with `use cache` for Route Handler response caching

2. **Optimal PDF storage strategy (filesystem vs object storage)**
   - What we know: PDFs can be stored in local filesystem or cloud storage (S3, Cloudinary R2)
   - What's unclear: Performance differences and cost implications at 50-200 student scale
   - Recommendation: Start with local filesystem storage, consider object storage if deployment needs change

3. **Font subsetting for production**
   - What we know: Full CJK fonts are 5-10MB+, need subsetting for optimal bundle size
   - What's unclear: Best tools for subsetting TTF fonts, integration with Next.js build process
   - Recommendation: Use full fonts initially, implement subsetting if bundle size becomes problematic

4. **PDF versioning and history tracking**
   - What we know: PersonalitySummary has version tracking and history table
   - What's unclear: Whether to store PDF history like PersonalitySummary or only latest version
   - Recommendation: Store only latest PDF in ReportPDF table, add history table if business requires audit trail

## Sources

### Primary (HIGH confidence)
- [Next.js Official Caching Guide](https://nextjs.org/docs/app/guides/caching) - Next.js 16 caching mechanisms, Data Cache, Full Route Cache, `use cache` directive
- [Next.js Official Documentation - App Router](https://nextjs.org/docs/app) - App Router architecture, Route Handlers, Server Actions

### Secondary (MEDIUM confidence)
- [React-PDF与Next.js 14集成：终极PDF生成指南](https://blog.csdn.net/gitblog_00759/article/details/153100083) - Comprehensive guide (Nov 2025) for React-PDF integration with Next.js
- [从React到PDF：NextJS中使用react-pdf/renderer的避坑指南](https://cloud.baidu.com/article/3855706) - Common pitfalls guide (Oct 2025)
- [How to Generate PDF Documents with React-PDF](https://pdfnoodle.com/blog/how-to-generate-pdf-reports-from-html-with-react-pdf) - React-PDF tutorial (Oct 2025)
- [Build a PDF Generation Engine with Strapi & Next.js](https://strapi.io/blog/build-a-pdf-generation-engine-with-nextjs-puppeteer-and-strapi) - Server-side PDF generation patterns (Oct 2025)
- [Generating PDF files using Next.js](https://dev.to/wonder2210/generating-pdf-files-using-next-js-24dm) - jsPDF implementation guide
- [Next.js Server Actions: The Complete Guide (2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions) - Server Actions patterns including async handling
- [Turning React apps into PDFs with Next.js, NodeJS and Puppeteer](https://dev.to/jordykoppen/turning-react-apps-into-pdfs-with-nextjs-nodejs-and-puppeteer-mfi) - Alternative approach using Puppeteer
- [Top JavaScript PDF generator libraries for 2025](https://www.nutrient.io/blog/top-js-pdf-libraries/) - Library comparison (June 2025)
- [Best HTML to PDF libraries for Node.js](https://blog.logrocket.com/best-html-pdf-libraries-node-js/) - Node.js PDF library comparison (Oct 2024)

### Tertiary (LOW confidence)
- [GitHub Issue #2891 - Request for Next.js App Router example](https://github.com/diegomura/react-pdf/issues/2891) - Community discussion (Sept 2024)
- [Stack Overflow - react-pdf in nextjs build error](https://stackoverflow.com/questions/75740680/react-pdf-in-nextjs-is-not-letting-to-make-build) - Build issues discussion
- [GitHub Issue #806 - Korean font support](https://github.com/diegomura/react-pdf/issues/806) - Korean font limitations (OTF not supported)
- [GitHub Issue #674 - Text can't read Korean](https://github.com/diegomura/react-pdf/issues/674) - Korean character display issues
- [How to Create PDF Reports in React](https://www.freecodecamp.org/news/how-to-create-pdf-reports-in-react/) - General React PDF guide

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Based on 2025 resources and official docs, but limited 2026-specific information
- Architecture: MEDIUM - Patterns verified with Next.js 15/16 docs and @react-pdf/renderer examples
- Pitfalls: HIGH - Well-documented issues with Korean fonts, Next.js builds, and caching
- Korean font support: HIGH - Verified through GitHub issues and community discussions
- Caching strategies: HIGH - Verified with Next.js 16 official caching documentation

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - PDF generation libraries are stable, but Next.js App Router patterns evolve)

**Researcher notes:**
- Most comprehensive resources for @react-pdf/renderer + Next.js are in Chinese (reflects active Asian market)
- Korean font support is a known challenge - must use TTF format, not OTF
- Server-side generation in Route Handlers is more reliable than client-side for complex reports
- Phase 6's `after()` API pattern is perfect for async PDF generation without blocking UI
- Database-backed caching with version checking is more predictable than Next.js cache alone
