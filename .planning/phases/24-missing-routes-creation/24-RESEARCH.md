# Phase 24: Missing Routes Creation - Research

**Research Date:** 2026-02-07
**Researcher:** Claude (Phase Researcher Agent)
**Status:** Ready for Planning

---

## Executive Summary

Phase 24는 테스트에서 참조하지만 아직 구현되지 않은 7개의 누락된 라우트 페이지를 생성하는 인프라 작업입니다. 이번 연구에서는 기존 코드베이스의 패턴을 분석하고, 각 라우트 구현에 필요한 기술적 결정 사항을 도출했습니다.

### 핵심 발견 요약

1. **Admin 페이지 통합**: 탭 기반 통합을 위해 단일 `/admin` 페이지 구조 대신 개별 라우트를 유지하며 통합 탭 UI를 적용
2. **RBAC 패턴**: `verifySession()` → 역할 검증 → `redirect()` 또는 권한 메시지 표시 패턴 확인
3. **Health Check API**: `/api/health` 엔드포인트 이미 구현됨 (DB, Storage, Backup 상태 확인)
4. **PDF 생성**: `@react-pdf/renderer` 사용, API 라우트(`/api/students/[id]/report`) 통해 제공
5. **팀 데이터**: `getTeams()`, `getTeamById()` 액션 이미 존재, RBAC 필터링 포함

---

## 목차 (Table of Contents)

1. [구현해야 할 라우트 목록](#1-구현해야-할-라우트-목록)
2. [기존 코드베이스 패턴 분석](#2-기존-코드베이스-패턴-분석)
3. [데이터 액션 및 API](#3-데이터-액션-및-api)
4. [권한 제어(RBAC) 패턴](#4-권한-제어rbac-패턴)
5. [UI 컴포넌트 패턴](#5-ui-컴포넌트-패턴)
6. [각 라우트별 구현 가이드](#6-각-라우트별-구현-가이드)
7. [의존성 및 제약사항](#7-의존성-및-제약사항)
8. [권장 구현 순서](#8-권장-구현-순서)
9. [열린 질문 및 결정 필요 사항](#9-열린-질문-및-결정-필요-사항)

---

## 1. 구현해야 할 라우트 목록

| 라우트 | 목적 | 우선순위 | 의존성 |
|--------|------|----------|--------|
| `/teachers/me` | 본인 프로필 조회 (자동 리다이렉트) | P0 | 없음 |
| `/admin/system-status` | 시스템 상태 모니터링 | P0 | `/api/health` |
| `/admin/system-logs` | 시스템 로그 조회 | P1 | 로그 저장소 |
| `/admin/database` | 데이터베이스 백업 관리 | P1 | 백업 시스템 |
| `/admin/audit-logs` | 감사 로그 (설정 변경 이력) | P2 | 감사 로그 저장소 |
| `/teams` | 팀 목록 | P0 | 없음 |
| `/teams/[id]` | 팀 상세 | P0 | `/teams` |
| `/students/[id]/report` | 리포트 프리뷰 및 PDF 다운로드 | P0 | PDF 생성 API |

---

## 2. 기존 코드베이스 패턴 분석

### 2.1 페이지 구조 패턴

**Server Component 페이지 구조:**
```typescript
// src/app/(dashboard)/admin/llm-settings/page.tsx
export default async function PageName() {
  const session = await verifySession();
  if (!session || session.role !== 'DIRECTOR') {
    redirect('/dashboard'); // 또는 권한 없음 메시지
  }

  const data = await getData();

  return (
    <div className="container py-6 space-y-8">
      {/* 콘텐츠 */}
    </div>
  );
}
```

**메타데이터 패턴:**
```typescript
export const metadata = {
  title: '페이지 제목 | AI AfterSchool',
  description: '페이지 설명',
};
```

### 2.2 레이아웃 및 탭 패턴

**학생 상세 페이지 탭 패턴** (`/students/[id]/page.tsx`):
```typescript
const tabs = [
  { id: 'learning', label: '학습' },
  { id: 'analysis', label: '분석' },
  { id: 'matching', label: '매칭' },
  { id: 'counseling', label: '상담' },
];
```

**팀 상세 레이아웃** (`/teams/[id]/layout.tsx`):
- 권한 검증: `checkTeamAccess()`
- 탭 내비게이션: 팀 정보 | 팀원 목록 | 구성 분석
- RBAC Prisma 사용: `getRBACPrisma(session)`

### 2.3 데이터 로딩 패턴

**Server Actions 사용** (`src/lib/actions/`):
```typescript
// lib/actions/teams.ts
export async function getTeams() {
  const session = await verifySession();
  const teams = await db.team.findMany({
    where: session.role === 'DIRECTOR' ? undefined : { id: session.teamId },
    // ...
  });
  return teams;
}
```

---

## 3. 데이터 액션 및 API

### 3.1 기존 액션 (재사용 가능)

| 액션 | 위치 | 용도 |
|------|------|------|
| `getTeams()` | `lib/actions/teams.ts` | 팀 목록 조회 (RBAC 필터링 포함) |
| `getTeamById(id)` | `lib/actions/teams.ts` | 팀 상세 조회 |
| `getTeacherById(id)` | `lib/actions/teachers.ts` | 선생님 상세 조회 |
| `getStudentById(id)` | `lib/actions/student.ts` | 학생 상세 조회 |
| `getCurrentTeacher()` | `lib/dal.ts` | 현재 로그인한 선생님 정보 |

### 3.2 Health Check API (이미 구현됨)

**엔드포인트:** `/api/health`

**응답 구조:**
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  checks: {
    database: HealthCheckItem
    storage: HealthCheckItem
    backup?: HealthCheckItem
  }
  uptime: number
  version?: string
}

interface HealthCheckItem {
  status: 'healthy' | 'unhealthy' | 'unknown'
  message?: string
  responseTime?: number
  connectionPool?: {
    total: number
    idle: number
    waiting: number
  }
}
```

**구현된 체크:**
- DB 연결 + 응답 시간 + 연결 풀 메트릭
- Storage 상태 (Local 또는 S3/MinIO)
- Backup 상태 (최신 백업 파일 확인)

### 3.3 PDF 생성 API (이미 구현됨)

**엔드포인트:** `/api/students/[id]/report`

**관련 라이브러리:**
```typescript
// lib/db/reports.ts
- getStudentReportPDF(studentId)
- shouldRegeneratePDF(studentId, currentDataVersion)
- saveReportPDF(params)
- fetchReportData(studentId, teacherId)

// lib/pdf/generator.ts
- pdfToBuffer(component)
- pdfToFile(component, outputPath)
- generateReportFilename(studentId, studentName, timestamp)
```

---

## 4. 권한 제어(RBAC) 패턴

### 4.1 역할(Role) 정의

```typescript
// lib/db/rbac.ts
export type TeacherRole = 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
```

### 4.2 세션 검증 패턴

```typescript
// lib/dal.ts
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    redirect('/auth/login')
  }

  return {
    isAuth: true,
    userId: payload.userId,
    role: payload.role,
    teamId: payload.teamId,
  }
})
```

### 4.3 권한 검증 패턴

**Admin 페이지:**
```typescript
const session = await verifySession();
if (!session || session.role !== 'DIRECTOR') {
  redirect('/dashboard');
}
```

**팀 관련 페이지:**
```typescript
const session = await verifySession();
// 원장: 모든 팀 접근
// 팀장/매니저/선생님: 자신의 팀만 접근
const canAccess = session.role === 'DIRECTOR' || session.teamId === teamId;
```

**RBAC Prisma 사용:**
```typescript
const rbacDb = getRBACPrisma(session);
// 자동으로 teamId 필터링 적용됨
```

---

## 5. UI 컴포넌트 패턴

### 5.1 shadcn/ui 컴포넌트

**사용 가능한 컴포넌트:**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Button`, `Input`, `Label`, `Select`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `DialogFooter`
- `Alert`, `AlertDialog`, `Badge`, `Progress`

### 5.2 아이콘 (lucide-react)

```typescript
import { Activity, DollarSign, Zap, Clock, Users, Database, Settings } from 'lucide-react';
```

### 5.3 에디트(Empty State) 패턴

```typescript
// components/students/empty-state.tsx
<EmptyState
  icon={Users}
  title="아직 등록된 선생님이 없어요"
  description="선생님을 등록하고 팀을 구성해보세요..."
  actionLabel="첫 선생님 등록하기"
  actionHref="/teachers/new"
  tips={[...]}
/>
```

---

## 6. 각 라우트별 구현 가이드

### 6.1 `/teachers/me` - 본인 프로필 조회

**구현 방식:** 리다이렉트 패턴
```typescript
// src/app/(dashboard)/teachers/me/page.tsx
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';

export default async function TeacherMePage() {
  const session = await verifySession();

  // 세션에서 현재 로그인한 선생님 ID를 가져와 리다이렉트
  redirect(`/teachers/${session.userId}`);
}
```

**필요한 작업:**
- [x] 기존 `/teachers/[id]` 페이지 재사용
- [x] 리다이렉트만 구현

### 6.2 `/admin/system-status` - 시스템 상태 모니터링

**데이터 소스:** `/api/health` 엔드포인트

**페이지 구조:**
```typescript
// src/app/(dashboard)/admin/system-status/page.tsx
export default async function SystemStatusPage() {
  const session = await verifySession();
  if (session.role !== 'DIRECTOR') {
    return <AccessDenied />;
  }

  const healthData = await fetch(`${origin}/api/health`).then(r => r.json());

  return (
    <div className="container py-6 space-y-8">
      <h1>시스템 상태</h1>

      {/* 서비스 상태 카드 */}
      <ServiceCard title="Database" status={healthData.checks.database} />
      <ServiceCard title="Storage" status={healthData.checks.storage} />
      {healthData.checks.backup && (
        <ServiceCard title="Backup" status={healthData.checks.backup} />
      )}

      {/* 시스템 메트릭 */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Uptime" value={formatUptime(healthData.uptime)} />
        <MetricCard label="Status" value={healthData.status} />
      </div>
    </div>
  );
}
```

**data-testid 계획:**
- `db-status`, `cache-status`, `storage-status`
- `service-database`, `service-redis`, `service-cloudinary`
- `system-uptime`

### 6.3 `/admin/system-logs` - 시스템 로그 조회

**데이터 소스:** Pino logger + DB 또는 파일 시스템

**구현 옵션:**
1. **DB 저장 (권장):** `SystemLog` 모델 생성하여 Prisma로 쿼리
2. **파일 기반:** 로그 파일을 직접 읽기

**페이지 구조:**
```typescript
// src/app/(dashboard)/admin/system-logs/page.tsx
export default async function SystemLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; page?: string }>;
}) {
  const session = await verifySession();
  if (session.role !== 'DIRECTOR') {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const level = params.level || 'ALL';
  const page = parseInt(params.page || '1');

  const logs = await getSystemLogs({ level, page });

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1>시스템 로그</h1>
        <LogLevelFilter currentLevel={level} />
      </div>

      <Table data-testid="system-logs-table">
        <TableHeader>
          <TableRow>
            <TableHead>시간</TableHead>
            <TableHead>레벨</TableHead>
            <TableHead>메시지</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} data-testid="log-row">
              <TableCell data-testid="log-timestamp">{log.timestamp}</TableCell>
              <TableCell>{log.level}</TableCell>
              <TableCell data-testid="log-message">{log.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**필요한 추가 작업:**
- [ ] `SystemLog` Prisma 모델 생성 (또는 로그 수집기 구현)
- [ ] `getSystemLogs()` 액션 함수 구현

### 6.4 `/admin/database` - 데이터베이스 백업 관리

**기존 백업 시스템:**
- 백업 디렉토리: `process.env.BACKUP_DIR || './backups'`
- 파일명 패턴: `{dbName}-{timestamp}.sql.gz`

**페이지 구조:**
```typescript
// src/app/(dashboard)/admin/database/page.tsx
export default async function DatabaseBackupPage() {
  const session = await verifySession();
  if (session.role !== 'DIRECTOR') {
    return <AccessDenied />;
  }

  const backups = await getBackupList();

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1>데이터베이스 백업</h1>
        <Button>수동 백업 생성</Button>
      </div>

      <div data-testid="backup-list">
        {backups.length === 0 ? (
          <EmptyState message="백업 파일이 없습니다." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>파일명</TableHead>
                <TableHead>크기</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.name}>
                  <TableCell>{backup.name}</TableCell>
                  <TableCell>{formatBytes(backup.size)}</TableCell>
                  <TableCell>{formatDate(backup.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">다운로드</Button>
                    <Button variant="ghost" size="sm">복원</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
```

**필요한 추가 작업:**
- [ ] `getBackupList()` 함수 구현
- [ ] `createBackup()` Server Action 구현
- [ ] `restoreBackup()` Server Action 구현 (백업 파일 선택)

### 6.5 `/admin/audit-logs` - 감사 로그

**목적:** 설정 변경 이력 추적

**데이터 모델 (생성 필요):**
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  teacherId  String
  action     String
  entityType String
  entityId   String?
  changes    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  teacher    Teacher  @relation(fields: [teacherId], references: [id])

  @@index([teacherId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
}
```

**페이지 구조:**
```typescript
// src/app/(dashboard)/admin/audit-logs/page.tsx
export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const session = await verifySession();
  if (session.role !== 'DIRECTOR') {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const logs = await getAuditLogs(params);

  return (
    <div className="container py-6 space-y-8">
      <h1>감사 로그</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>시간</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>작업</TableHead>
            <TableHead>변경내용</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} data-testid="audit-log-row">
              <TableCell data-testid="log-timestamp">{log.createdAt}</TableCell>
              <TableCell>{log.teacher.name}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{formatChanges(log.changes)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**필요한 추가 작업:**
- [ ] `AuditLog` Prisma 모델 생성
- [ ] `logAuditAction()` 함수 구현 (주요 설정 변경 시 호출)
- [ ] `getAuditLogs()` 액션 함수 구현

### 6.6 `/teams` - 팀 목록

**데이터 소스:** `getTeams()` (이미 구현됨)

**페이지 구조** (`/students` 패턴 따르기):
```typescript
// src/app/(dashboard)/teams/page.tsx
import Link from 'next/link';
import { getTeams } from '@/lib/actions/teams';
import { EmptyState } from '@/components/students/empty-state';
import { Users } from 'lucide-react';

export default async function TeamsPage() {
  const session = await verifySession();
  const teams = await getTeams();

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">팀 관리</h1>
          <p className="text-gray-500">
            {teams.length > 0
              ? `총 ${teams.length}개의 팀이 있어요`
              : '팀을 생성해보세요'}
          </p>
        </div>
        {session.role === 'DIRECTOR' && (
          <Button asChild>
            <Link href="/teams/new">팀 생성</Link>
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="아직 팀이 없어요"
          description="팀을 생성하고 선생님과 학생을 배정해보세요."
          actionLabel="첫 팀 생성하기"
          actionHref="/teams/new"
          tips={[
            '팀 이름으로 생성해요',
            '선생님을 팀에 배정할 수 있어요',
            '팀 단위로 학생을 관리할 수 있어요',
          ]}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    선생님 {team._count.teachers}명 |
                    학생 {team._count.students}명
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6.7 `/teams/[id]` - 팀 상세

**기존 레이아웃:** `/teams/[id]/layout.tsx` 이미 존재

**필요한 페이지:**
```typescript
// src/app/(dashboard)/teams/[id]/page.tsx
import Link from 'next/link';
import { getTeamById } from '@/lib/actions/teams';
import { notFound } from 'next/navigation';

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>팀 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <span className="text-gray-500">팀 이름:</span> {team.name}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>소속 선생님</CardTitle>
        </CardHeader>
        <CardContent>
          {team.teachers.length === 0 ? (
            <p className="text-gray-500">소속 선생님이 없어요</p>
          ) : (
            <ul>
              {team.teachers.map((teacher) => (
                <li key={teacher.id}>
                  <Link href={`/teachers/${teacher.id}`}>
                    {teacher.name} ({teacher.role})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>소속 학생</CardTitle>
        </CardHeader>
        <CardContent>
          {team.students.length === 0 ? (
            <p className="text-gray-500">소속 학생이 없어요</p>
          ) : (
            <ul>
              {team.students.map((student) => (
                <li key={student.id}>
                  <Link href={`/students/${student.id}`}>
                    {student.name} ({student.grade}학년)
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6.8 `/students/[id]/report` - 리포트 프리뷰 및 PDF 다운로드

**통합 방식:** 학생 상세 페이지의 탭으로 통합

**수정 필요:** `/students/[id]/page.tsx`
```typescript
// tabs 배열에 'report' 추가
const tabs = [
  { id: 'learning', label: '학습' },
  { id: 'analysis', label: '분석' },
  { id: 'matching', label: '매칭' },
  { id: 'counseling', label: '상담' },
  { id: 'report', label: '리포트' }, // 추가
];
```

**리포트 탭 컴포넌트:**
```typescript
// src/components/students/tabs/report-tab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportTabProps {
  studentId: string;
  studentName: string;
}

export default function ReportTab({ studentId, studentName }: ReportTabProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // PDF 다운로드
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/report`);
      if (!response.ok) throw new Error('PDF 생성 실패');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${studentName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF 다운로드 완료');
    } catch (error) {
      toast.error('PDF 다운로드 실패');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            종합 리포트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            학생의 모든 분석 결과가 포함된 종합 리포트를 다운로드할 수 있습니다.
          </p>

          <div className="flex gap-4">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              PDF 다운로드
            </Button>
          </div>

          {/* 미리보기 섹션 (선택 사항) */}
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold mb-4">포함될 내용</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>기본 정보 (이름, 학교, 학년)</li>
              <li>사주 분석</li>
              <li>이름 분석</li>
              <li>MBTI 성격 유형</li>
              <li>관상 분석</li>
              <li>손금 분석</li>
              <li>학습 전략</li>
              <li>진로 가이드</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. 의존성 및 제약사항

### 7.1 기존 의존성

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `next` | 15.x | App Router |
| `prisma` | latest | ORM |
| `@prisma/client` | latest | DB 클라이언트 |
| `@radix-ui/*` | latest | UI 컴포넌트 기반 |
| `lucide-react` | latest | 아이콘 |
| `@react-pdf/renderer` | latest | PDF 생성 |
| `pino` | latest | 로깅 |
| `recharts` | latest | 차트 (학습 탭에서 사용) |
| `sonner` | latest | Toast 알림 |
| `date-fns` | latest | 날짜 포맷 |

### 7.2 추가 의존성 필요 여부

- ❌ 새로운 의존성 없음
- ✅ 기존 라이브러리로 충분

### 7.3 Prisma 스키마 변경 필요

**新增 모델 (감사 로그용):**
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  teacherId  String
  action     String
  entityType String
  entityId   String?
  changes    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([teacherId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
}

// Teacher 모델에 관계 추가
model Teacher {
  // ... 기존 필드
  auditLogs  AuditLog[]
}
```

**新增 모델 (시스템 로그용 - 선택 사항):**
```prisma
model SystemLog {
  id        String   @id @default(cuid())
  level     String   // ERROR, WARN, INFO, DEBUG
  message   String
  context   Json?
  timestamp DateTime @default(now())

  @@index([level])
  @@index([timestamp(sort: Desc)])
}
```

---

## 8. 권장 구현 순서

### Phase 24-1: 기본 인프라 (1-2일)
1. Prisma 스키마 업데이트 (AuditLog 모델)
2. `/teachers/me` 리다이렉트 페이지

### Phase 24-2: 팀 관리 (1일)
3. `/teams` 목록 페이지
4. `/teams/[id]` 상세 페이지 (팀 정보 탭)

### Phase 24-3: Admin 페이지 (2-3일)
5. `/admin/system-status` 페이지
6. `/admin/database` 백업 관리 페이지
7. `/admin/system-logs` 페이지 (DB 저장 방식)

### Phase 24-4: 감사 및 리포트 (1-2일)
8. `/admin/audit-logs` 페이지
9. `/students/[id]/report` 탭 통합

### Phase 24-5: 테스트 및 data-testid 추가 (1일)
10. 모든 페이지에 data-testid 추가
11. E2E 테스트 확인

---

## 9. 열린 질문 및 결정 필요 사항

### 9.1 Claude's Discretion 영역

| 항목 | 기본 제안 | 대안 |
|------|-----------|------|
| **데이터베이스 백업 UI** | 테이블 + 다운로드/복원 버튼 | 카드 뷰 + 일별 백업 표시 |
| **팀 목록/상세 UI** | `/students` 패턴 따르기 (카드) | 테이블 형식 |
| **에러 상태 처리** | `Card` + 에러 메시지 + 재시도 버튼 | `Alert` 컴포넌트 사용 |
| **404 처리** | `notFound()` 호출 | 커스텀 404 페이지 |
| **시스템 로그 저장소** | DB (SystemLog 모델) | 파일 시스템 (pino 출력) |

### 9.2 결정이 필요한 사항

1. **시스템 로그 저장 방식**
   - 옵션 A: DB에 저장 (실시간 쿼리 가능, 추가 스토리지 비용)
   - 옵션 B: 파일 시스템 (기존 pino 로그 파일 활용, 검색 어려움)
   - **권장:** DB 저장 (Prisma 쿼리로 필터링/정렬 용이)

2. **감사 로그 범위**
   - 어떤 작업을 기록할까요?
     - LLM 설정 변경
     - 팀/선생님/학생 생성/수정/삭제
     - 권한 변경
   - **권장:** 중요 설정 변경부터 시작 (단계적 확장)

3. **백업 복원 방식**
   - 자동 복원 vs 관리자 승인 후 복원
   - **권장:** 관리자 승인 후 복원 (다이얼로그 확인)

4. **팀 생성 라우트**
   - `/teams/new` 별도 페이지 필요?
   - `/admin` 페이지의 일부로 통합?
   - **권장:** `/teams/new` 별도 페이지 (목록과 일관성)

---

## 10. 참고 자료

### 10.1 기존 파일 위치

| 유형 | 경로 |
|------|------|
| **Admin 페이지** | `src/app/(dashboard)/admin/` |
| **팀 페이지** | `src/app/(dashboard)/teams/` |
| **학생 페이지** | `src/app/(dashboard)/students/` |
| **선생님 페이지** | `src/app/(dashboard)/teachers/` |
| **Server Actions** | `src/lib/actions/` |
| **RBAC** | `src/lib/db/rbac.ts`, `src/lib/dal.ts` |
| **Health API** | `src/app/api/health/route.ts` |
| **PDF 생성** | `src/lib/pdf/generator.ts`, `src/lib/db/reports.ts` |
| **Logger** | `src/lib/logger/index.ts` |
| **UI 컴포넌트** | `src/components/ui/` |

### 10.2 관련 문서

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Client](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [shadcn/ui](https://ui.shadcn.com/)
- [@react-pdf/renderer](https://react-pdf.org/)
- [Pino Logger](https://getpino.io/)

---

**연구 완료:** 이 문서는 Phase 24 계획 수립을 위한 충분한 정보를 포함하고 있습니다.
