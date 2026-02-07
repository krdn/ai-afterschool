# Phase 27: RBAC, Auth & Error Handling - Research

**Researched:** 2026-02-07
**Domain:** Next.js 15 App Router RBAC, Error Handling, Auth Token Validation
**Confidence:** HIGH

## Summary

Phase 27은 기존 시스템의 보안 강화와 에러 처리 개선에 집중합니다. 새로운 기능 추가 없이 RBAC 접근 제어를 강화하고, 404/403/401 에러 페이지를 개선하며, 파일 업로드 에러와 비밀번호 재설정 토큰 에러를 사용자 친화적으로 처리합니다.

연구 결과:
- **RBAC**: 현재 구현된 `verifySession()` + `getRBACPrisma()` 패턴이 잘 동작하며, Server Action 레벨에서 검증이 필요
- **에러 페이지**: Next.js 15의 `not-found.js`, `error.js`, `global-error.tsx` 패턴 활용 가능
- **Toast**: Sonner v2.0.7이 이미 설치되어 있으며, shadcn/ui와 통합되어 있음
- **파일 업로드**: Cloudinary 제한 사이드에서 validation이 필요하며, 에러 메시지 UI 개선 필요
- **토큰 에러**: 현재 구현이 기본적이며, 상세 정보 표시와 재발송 기능 강화 필요

**Primary recommendation:** 기존 RBAC 패턴을 유지하며, 에러 페이지와 Toast 메시지를 사용자 친화적으로 개선하고, Server Action 레벨에서 일관된 에러 처리를 적용합니다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 접근 거부 UX (Access Denied)
- **에러 표시**: Toast notification + "이 페이지에 접근할 권한이 없습니다" 메시지 (권한 부족 명시)
- **사용자 안내**: Dashboard로 이동하는 버튼 표시 (친근한 피드백)
- **보안 로깅**: 의심스러운 활동(반복 접근 시도)만 server.log에 기록
- **리다이렉션**: 자동 리다이렉션 없이, 사용자가 Dashboard 버튼을 클릭하도록 유도

#### 에러 페이지 디자인
- **404 스타일**: Friendly UI (아이콘 + 설명 + 해결 제안)
- **정보 표시**: 상세 정보 포함 (요청한 경로 + 예상 리소스 + 제안 URL)
- **에러 타입별**: 각 에러 코드(404, 403, 401, 500)마다 다른 아이콘/메시지/색상 적용
- **복귀 옵션**: 다중 복귀 경로 (Dashboard, 학생 목록, 상담 페이지, 이전 페이지 버튼)

#### 팀장 역할 범위 (Team Lead Permissions)
- **Teachers 페이지**: 팀 전체 관리 가능 (생성/수정/삭제 모두 허용)
- **Admin 페이지**: 모든 Admin 탭 허용 (LLM 설정, 토큰 사용량, 시스템 상태 등)
- **팀 데이터 접근**: 자신의 팀 데이터만 접근 가능, 타 팀 데이터 완전 차단
- **접근 제어 레벨**: Server Action 레벨에서 RBAC 검증 (런타임 체크)

#### 토큰 에러 처리 (Password Reset Token)
- **만료 토큰**: 상세 메시지 (토큰 생성 시간과 만료 시간 표시) + 재발송 버튼
- **재발송 흐름**: 같은 페이지에서 이메일 입력 폼 표시 (즉시 재발송 가능)
- **보안 로깅**: 의심스러운 반복 시도만 로깅
- **토큰 타입별**: 토큰 타입(비밀번호 재설정, 이메일 인증 등)마다 다른 에러 메시지

### Claude's Discretion
- 구체적인 아이콘/색상 선택 (shadcn/ui 아이콘과 테마 유지)
- 의심스러운 활동 판별 기준 (반복 횟수 임계값)
- 토큰 만료 시간 표시 형식 (한국어 로케일)
- 에러 페이지 애니메이션/트랜지션

### Deferred Ideas (OUT OF SCOPE)
없음 — 논의가 Phase 27 범위 내에 유지되었습니다.
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js** | 15.5.10 | App Router Error Handling | `not-found.js`, `error.js`, `global-error.tsx` 파일 규칙 제공 |
| **Sonner** | 2.0.7 | Toast Notifications | shadcn/ui 공식 toast 컴포넌트, 간단한 API |
| **shadcn/ui** | latest | UI Components | Alert, Card, Button 등 에러 페이지용 컴포넌트 |
| **lucide-react** | 0.563.0 | Icons | 아이콘 제공 (AlertTriangle, XCircle, etc.) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **next-cloudinary** | 6.17.5 | Image Upload | 파일 업로드 에러 처리 |
| **argon2** | 0.44.0 | Password Hashing | 비밀번호 재설정 토큰 관련 |
| **zod** | 4.3.6 | Validation | Server Action input 검증 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | react-hot-toast | Sonner가 shadcn/ui 공식, 더 최신 |
| next-cloudinary | 직접 S3 업로드 | Cloudinary가 이미 통합됨 |

**Installation:**
```bash
# 이미 설치됨
npm install sonner lucide-react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── teachers/
│   │   │   ├── page.tsx          # RBAC 체크 강화
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # 404 처리 개선
│   │   │   └── not-found.tsx     # NEW: Teachers 전용 404
│   │   ├── admin/
│   │   │   ├── page.tsx          # TEAM_LEADER 접근 허용
│   │   │   └── not-found.tsx     # NEW: Admin 전용 404
│   │   └── not-found.tsx         # NEW: Dashboard 전용 404
│   ├── auth/
│   │   └── reset-password/
│   │       ├── [token]/
│   │       │   └── page.tsx      # 토큰 에러 UI 개선
│   │       └── not-found.tsx     # NEW: Reset token 404
├── components/
│   ├── errors/
│   │   ├── access-denied-page.tsx      # NEW: 403 전용 페이지
│   │   ├── error-page.tsx              # NEW: 공통 에러 페이지
│   │   └── not-found-page.tsx          # NEW: 공통 404 페이지
│   └── ui/
│       └── sonner.tsx                  # 이미 존재
└── lib/
    ├── actions/
    │   ├── teachers.ts         # RBAC 검증 강화
    │   └── auth.ts             # 토큰 검증 개선
    └── db/
        └── rbac.ts             # 이미 존재, 확장 가능
```

### Pattern 1: Server Action RBAC Verification
**What:** Server Action 레벨에서 일관된 RBAC 검증 패턴
**When to use:** 모든 데이터 조작 Server Action
**Example:**
```typescript
// src/lib/actions/teachers.ts
export async function deleteTeacher(id: string): Promise<void> {
  const session = await verifySession()

  // 권한 검증: 원장만 삭제 가능
  if (session.role !== 'DIRECTOR') {
    throw new Error("선생님을 삭제할 권한이 없어요")
  }

  // 본인 삭제 방지
  if (session.userId === id) {
    throw new Error("본인 계정은 삭제할 수 없어요")
  }

  // ... 삭제 로직
}
```

### Pattern 2: not-found.js for Route-Level 404
**What:** Next.js 15의 `not-found.js` 파일로 라우트 레벨 404 처리
**When to use:** 리소스를 찾을 수 없을 때
**Example:**
```typescript
// src/app/(dashboard)/teachers/[id]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { UserX } from 'lucide-react'

export default function TeacherNotFound() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5 text-muted-foreground" />
          선생님을 찾을 수 없어요
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          요청하신 선생님 정보를 찾을 수 없어요.
          삭제되었거나 잘못된 주소일 수 있어요.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/teachers">선생님 목록</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">대시보드</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### Pattern 3: Toast Notification for Action Feedback
**What:** Server Action 에러를 Toast로 표시
**When to use:** 사용자 피드백이 필요한 모든 액션
**Example:**
```typescript
'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DeleteTeacherButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    const result = await deleteTeacher(id)

    if (result?.error) {
      toast.error('삭제 실패', {
        description: result.error,
      })
    } else {
      toast.success('삭제 완료', {
        description: '선생님이 삭제되었어요',
      })
      router.push('/teachers')
    }
  }

  return <button onClick={handleDelete}>삭제</button>
}
```

### Anti-Patterns to Avoid
- **자동 리다이렉션**: 사용자에게 이유를 설명하지 않고 자동으로 리다이렉트하지 마세요
- **보안 정보 노출**: 에러 메시지에 내부 구조나 경로를 노출하지 마세요
- **일관성 없는 에러 처리**: 모든 에러를 동일한 패턴으로 처리하세요

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast Component | 직접 toast UI 구현 | Sonner | 애니메이션, 포지셔닝, 중복 처리 등 복잡함 |
| 에러 페이지 레이아웃 | 직접 CSS 작성 | shadcn/ui Card, Alert | 이미 디자인 시스템과 통합됨 |
| RBAC 미들웨어 | 복잡한 미들웨어 작성 | Server Action + verifySession | Next.js 15 App Router 패턴에 맞음 |

**Key insight:** 에러 처리는 "간단해 보이지만" 엣지 케이스가 많습니다. 기존 라이브러리를 사용하세요.

## Common Pitfalls

### Pitfall 1: notFound() vs redirect()
**What goes wrong:** 404应该用 `notFound()` 대신 `redirect('/404')` 사용
**Why it happens:** 이전 버전 Next.js 습관
**How to avoid:** 항상 `notFound()` 사용, `not-found.js` 파일 생성
**Warning signs:** 404 페이지가 200 상태 코드를 반환

### Pitfall 2: Toast가 Client Component에서만 작동
**What goes wrong:** Server Component에서 `toast()` 호출 시 렌더링 에러
**Why it happens:** Sonner는 Client Component 전용
**How to avoid:** Server Action에서는 에러를 반환하고, Client에서 toast 호출
**Warning signs:** "toast is not defined" 또는 렌더링 에러

### Pitfall 3: RBAC 누락
**What goes wrong:** 페이지 레벨에서만 체크하고 Server Action에서 누락
**Why it happens:** "UI 숨김=보안" 오해
**How to avoid:** 모든 Server Action에서 `verifySession()` 후 역할 체크
**Warning signs:** 삭제/수정 액션에 권한 체크 없음

## Code Examples

Verified patterns from official sources:

### Access Denied Response (403)
```typescript
// src/components/errors/access-denied-page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX } from 'lucide-react'

interface AccessDeniedPageProps {
  resource?: string
  action?: string
}

export function AccessDeniedPage({ resource = '이 페이지', action = '접근' }: AccessDeniedPageProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="mt-4 text-center">접근 권한이 없어요</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <p className="text-muted-foreground">
            {resource}에 {action}할 권한이 없어요.
          </p>
          <p className="text-sm text-muted-foreground">
            필요한 권한이 있는지 확인하거나 관리자에게 문의해주세요.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/students">학생 목록</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
```

### Password Reset Token Error with Details
```typescript
// src/app/auth/reset-password/[token]/page.tsx
import { db } from '@/lib/db'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>유효하지 않은 링크</CardTitle>
        </CardHeader>
        <CardContent>
          <p>비밀번호 재설정 링크가 유효하지 않아요.</p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/reset-password">다시 요청하기</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (resetToken.expiresAt < new Date()) {
    const timeAgo = formatDistanceToNow(resetToken.expiresAt, {
      addSuffix: true,
      locale: ko,
    })

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-center">
            <Clock className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>링크가 만료되었어요</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>이 링크는 {timeAgo} 만료되었어요.</p>
          <p className="text-sm text-muted-foreground">
            보안을 위해 비밀번호 재설정 링크는 1시간 동안만 유효해요.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/reset-password">재발송 받기</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // ... 정상 흐름
}
```

### File Upload Error Handling
```typescript
// Client-side file size validation
'use client'

import { toast } from 'sonner'
import { CldUploadWidget } from 'next-cloudinary'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ImageUploader({ studentId }: { studentId: string }) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={{
        maxFileSize: MAX_FILE_SIZE,
        maxFiles: 1,
        folder: `students/${studentId}/profile`,
      }}
      onError={(error) => {
        if (error.message.includes('File too large')) {
          toast.error('파일 크기 초과', {
            description: '파일은 최대 10MB까지 업로드할 수 있어요',
          })
        } else {
          toast.error('업로드 실패', {
            description: error.message,
          })
        }
      }}
    >
      {({ open }) => (
        <button onClick={() => open()}>이미지 업로드</button>
      )}
    </CldUploadWidget>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router `getInitialProps` | App Router `error.js`, `not-found.js` | Next.js 13+ | 에러 처리가 파일 기반으로 단순화 |
| `redirect('/404')` | `notFound()` + `not-found.js` | Next.js 13.3+ | 올바른 404 상태 코드 반환 |
| react-hot-toast | Sonner (shadcn/ui 공식) | 2024+ | shadcn/ui와 통합, 더 나은 UX |

**Deprecated/outdated:**
- **Pages Router 에러 처리**: App Router로 마이그레이션됨
- **`redirect('/404')` 패턴**: `notFound()` 사용 권장

## Open Questions

1. **팀장의 Admin 페이지 접근 범위**
   - What we know: TEAM_LEAD는 자신의 팀 데이터만 접근 가능
   - What's unclear: Admin 페이지의 어떤 탭까지 허용할지 (LLM 설정, 토큰 사용량 등)
   - Recommendation: CONTEXT.md 결정에 따라 "모든 Admin 탭 허용"으로 구현

2. **의심스러운 활동 판별 기준**
   - What we know: 반복 접근 시도만 로깅
   - What's unclear: 구체적인 임계값 (분당 몇 회?)
   - Recommendation: 5분 내 3회 실패 시 로깅

## Sources

### Primary (HIGH confidence)
- [Next.js not-found.js documentation](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) - 공식 Next.js 15 에러 처리 문서
- [Sonner GitHub Repository](https://github.com/emilkowalski/sonner) - Sonner 공식 저장소
- [shadcn/ui Sonner Documentation](https://ui.shadcn.com/docs/components/radix/sonner) - shadcn/ui Sonner 통합 가이드

### Secondary (MEDIUM confidence)
- [Cloudinary Upload Limits Guide](https://cloudinary.com/guides/video-effects/how-to-upload-large-video) - 파일 크기 제한 정보
- [ReUI Sonner Documentation](https://reui.io/docs/sonner) - 2026년 최신 Sonner 사용법

### Tertiary (LOW confidence)
- [Stack Overflow: Not Found Page With Custom layout NextJS 15](https://stackoverflow.com/questions/79502390/not-found-page-with-custom-layout-nextjs-15) - Next.js 15 not-found 이슈

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 모든 라이브러리가 프로젝트에 이미 설치됨
- Architecture: HIGH - 기존 RBAC 패턴 분석 완료
- Pitfalls: HIGH - Next.js 15 에러 처리 패턴 문서화됨

**Research date:** 2026-02-07
**Valid until:** 2026-03-09 (30일 - 안정적인 도메인)
