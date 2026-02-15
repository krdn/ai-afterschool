# 데모 시드 데이터 시스템 설계

**작성일**: 2026-02-15
**상태**: 승인됨

## 목적

운영 환경에서 데모를 위해 데이터를 선택적으로 리셋/추가할 수 있는 시드 시스템.
기존 `seed-core.ts`를 확장하여 모델별 그룹 선택과 merge/reset 모드를 지원한다.

## 요구사항

- 모델별(팀/선생님/학생/학부모/LLM설정/Provider) 그룹 선택
- 각 그룹별 merge(추가/갱신) 또는 reset(삭제 후 재생성) 모드
- 웹 UI + CLI 양쪽에서 실행 가능
- 웹 UI 실행 시 관리자 비밀번호 확인 필수
- CLI는 서버 접근 자체가 인증이므로 비밀번호 불필요
- FK 의존성에 따른 cascade 자동 처리

## 데이터 범위

기존 `seed-data.ts` 활용 (분석 결과 미포함):

| 그룹 | 건수 | 소스 |
|------|------|------|
| teams | 3 | SEED_TEAMS |
| teachers | 10 | SEED_TEACHERS |
| students | 8 | SEED_STUDENTS |
| parents | 9 | SEED_PARENTS |
| llmConfigs | 6 | SEED_LLM_CONFIGS |
| providers | 7 | SEED_PROVIDERS |

## 설계

### 코어 타입

```typescript
type SeedGroup = 'teams' | 'teachers' | 'students' | 'parents' | 'llmConfigs' | 'providers'
type SeedMode = 'merge' | 'reset'

type SeedOptions = {
  groups: SeedGroup[]
  modes: Partial<Record<SeedGroup, SeedMode>>
}
```

### 리셋 삭제 순서 (FK 안전)

```
삭제: parents → students → teachers → teams
추가: teams → teachers → students → parents
```

LLM 설정 / Provider는 독립적이므로 순서 무관.

### 의존성 자동 cascade

| 리셋 대상 | 자동 포함 |
|-----------|----------|
| teams | teachers, students, parents |
| teachers | students, parents |
| students | parents |
| parents | (없음) |
| llmConfigs | (독립) |
| providers | (독립) |

### 웹 UI

기존 `DatabaseTab` 컴포넌트의 AlertDialog를 확장:

1. 그룹 선택 체크박스
2. 선택된 그룹별 merge/reset 라디오
3. 관리자 비밀번호 입력 필드
4. 리셋 그룹 존재 시 빨간 경고
5. 의존성 자동 체크 (students reset → parents 자동 reset)

### CLI

```bash
# 전체 시드 (merge)
npx tsx scripts/seed-demo.ts

# 특정 그룹
npx tsx scripts/seed-demo.ts --groups teams,students

# 리셋 모드
npx tsx scripts/seed-demo.ts --groups students,parents --reset students,parents --confirm
```

### 안전장치

- 트랜잭션: `prisma.$transaction`으로 전체 롤백 보장
- 웹 UI: 관리자 비밀번호 검증 (argon2.verify)
- CLI: `--reset` 시 `--confirm` 플래그 필수
- 감사 로그: AuditLog + SystemLog에 실행 기록

### Server Action

```typescript
export async function runSeedAction(
  options: SeedOptions,
  password: string
): Promise<ActionResult<SeedResult>>
```

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/db/seed-core.ts` | SeedOptions 파라미터 추가, reset 로직 |
| `src/app/(dashboard)/admin/database/actions.ts` | 비밀번호 검증 + 옵션 전달 |
| `src/components/admin/tabs/database-tab.tsx` | 그룹 선택 UI, 모드 선택, 비밀번호 입력 |
| `scripts/seed-demo.ts` | 신규 CLI 스크립트 |
| `package.json` | `seed:demo` 스크립트 추가 |
