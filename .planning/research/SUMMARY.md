# Project Research Summary

**Project:** AI AfterSchool — v4.0 @Mention Smart Chat
**Domain:** @mention-based entity context injection for existing Next.js AI chat system
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

이 마일스톤은 신규 시스템 구축이 아니라 **기존 스트리밍 AI 채팅에 @멘션 레이어를 추가하는 점진적 확장**이다. 핵심 인프라(ChatSession/ChatMessage 모델, streamWithProvider, Prisma 스키마의 모든 분석 모델)가 이미 완비되어 있어, 필요한 신규 코드 범위는 의외로 좁다. 새 라이브러리는 단 하나(react-mentions-ts@5.4.7)이며, 나머지는 기존 Prisma, Vercel AI SDK, shadcn/ui 패턴의 조합으로 구현 가능하다.

아키텍처 연구는 기존 코드베이스를 직접 분석한 결과를 기반으로 한다. `streamWithProvider()`의 `system` 파라미터가 이미 `string`을 받으므로 동적 프롬프트 주입에 API 변경이 필요 없다. 자동완성 검색은 Server Action이 아닌 GET API Route로 구현해야 AbortController를 통한 요청 취소가 가능하며, 이는 @멘션 UX의 핵심 요건이다. 클라이언트는 엔티티 ID 튜플만 전송하고 서버에서 데이터를 조회하는 Server-side Resolution 패턴이 보안과 RBAC 준수를 보장한다.

가장 중요한 위험은 **보안(RBAC 미적용 시 팀 간 데이터 노출)**과 **토큰 예산(전체 학생 데이터 주입 시 컨텍스트 초과)**이다. 두 위험 모두 Phase 1에서 설계 수준에서 해결해야 하며, 구현 후 패치는 비용이 크다. Indirect Prompt Injection(OWASP LLM Top 10 #1) 방어를 위한 경계 마킹도 시스템 프롬프트 빌더 설계 시 함께 적용해야 한다.

---

## Key Findings

### Recommended Stack

기존 스택 위에 **단 하나의 신규 패키지**만 추가한다. react-mentions-ts@5.4.7은 React 19 네이티브이며, 프로젝트에 이미 설치된 `clsx`, `class-variance-authority`, `tailwind-merge`를 peer dep으로 사용해 실질적 추가 의존성이 없다. 동적 시스템 프롬프트 생성은 Vercel AI SDK의 `system` 파라미터에 템플릿 리터럴을 전달하는 방식으로 신규 라이브러리 없이 구현한다. 엔티티 데이터 집계는 Prisma `select` 쿼리로 충분하며 RAG 파이프라인(LangChain 등)은 불필요하다.

**Core technologies:**
- **react-mentions-ts@5.4.7**: @멘션 자동완성 textarea — React 19 네이티브, peer deps 전부 기존 설치됨, Tailwind v4 호환 선언
- **Prisma `select` 쿼리**: 엔티티 데이터 집계 — 기존 패턴 재사용, over-fetching 방지
- **Vercel AI SDK `system` 파라미터**: 동적 시스템 프롬프트 — 기존 인터페이스 그대로 사용
- **GET API Route (신규)**: 자동완성 검색 — Server Action 대신 GET Route로 AbortController 취소 지원
- **`use-debounce@10.1.0`**: 자동완성 디바운스 — 이미 설치됨

**Fallback:** react-mentions-ts와 shadcn/ui 스타일 충돌 발생 시 `@ariakit/react` combobox-textarea 패턴으로 대체 (별도 설치 필요).

**절대 추가하지 않을 것:**
- Tiptap / Slate / Lexical — rich text editor, ~200KB 번들, 기존 스트리밍 UI 아키텍처와 충돌
- LangChain / LlamaIndex — vector DB, 구조화된 PostgreSQL 데이터에 불필요
- react-query / SWR — 기존 Server Action + useDebouncedCallback 패턴으로 충분

### Expected Features

**Must have (v1 MVP — table stakes):**
- @ 타이핑 시 학생/선생님/학급 자동완성 드롭다운 — 업계 표준 패턴 (Notion AI, Slack, Cursor 동일)
- 키보드 네비게이션 (↑↓, Enter, Esc) — 마우스 없이 완전 조작
- 확정된 @멘션의 시각적 칩(chip) 표시 — 사용자가 무엇이 참조됐는지 확인
- @학생 → 핵심 프로필 + PersonalitySummary + 최신 SajuAnalysis 요약 시스템 프롬프트 주입 (약 800 토큰)
- @선생님, @학급 엔티티 타입 지원
- 컨텍스트 없이도 기존 채팅 정상 동작 (하위 호환)

**Should have (v1.x — validation 후 추가):**
- LLMQueryBar @멘션 지원 (MentionInput 컴포넌트 재사용)
- 복수 학생 동시 멘션 (궁합 질문: "@홍길동 @이순신 궁합 어때?")
- 메시지 히스토리에 @멘션 하이라이트 렌더링
- 자동완성 드롭다운에 학생 학년/학교 미리보기 (동명이인 구분)

**Defer (v2+):**
- 데이터 타입 선택적 주입 (`@홍길동:사주`, `@홍길동:MBTI`) — 토큰 최적화, UI 복잡도 높음
- ChatSession에 mentionedEntities 컬럼 추가 (상담 이력 추적) — DB 마이그레이션 필요
- 주입 데이터 LLM 요약 압축 — 구현 복잡도 높음

**Anti-features (도입하지 않을 것):**
- 전체 학생 목록 자동 주입 — 토큰 폭발 (학생 100명 시 컨텍스트 초과)
- @멘션마다 별도 AI 호출 (에이전트 체인) — 지연 × 멘션 수, 비용 × 멘션 수
- 벡터 검색 자동완성 — 단순 이름 검색으로 충분, 불필요한 복잡도
- 리치 텍스트 에디터 전면 도입 — 오버엔지니어링

### Architecture Approach

기존 `ChatInput → ChatPage → useChatStream → /api/chat → streamWithProvider` 파이프라인을 **최소한으로 수정**하면서 멘션 레이어를 삽입한다. 새로운 서버 모듈(`mention-resolver.ts`, `context-builder.ts`)이 route.ts에 통합되며, 클라이언트는 `[{ id, type }]` 튜플만 전송하고 실제 데이터 조회는 서버에서만 발생한다. 자동완성은 독립적인 GET route(`/api/chat/mentions/search`)로 처리하며 메인 채팅 API와 분리된다.

**Major components:**

| 컴포넌트 | 상태 | 역할 |
|---------|------|------|
| `mention-types.ts` | NEW | 공유 타입 정의 — 모든 파일의 import 기준점 |
| `mention-resolver.ts` | NEW | RBAC 포함 엔티티 데이터 DB 조회 |
| `context-builder.ts` | NEW | 토큰 예산 제한 + Prompt Injection 방어 포함 프롬프트 빌더 |
| `/api/chat/mentions/search` | NEW | 엔티티 검색 GET route (AbortController 취소 지원) |
| `use-mention.ts` | NEW | 자동완성 상태 및 디바운스 페치 훅 |
| `MentionDropdown` | NEW | 자동완성 UI (기존 Command/Popover 패턴 재사용) |
| `MentionTag` | NEW | 메시지 버블 내 @이름 칩 렌더링 |
| `/api/chat/route.ts` | MODIFIED | mentions[] 수신, resolver/builder 호출, dynamic system 전달 |
| `ChatInput.tsx` | MODIFIED | MentionTextarea + MentionDropdown 통합 |
| `ChatMessage` DB 모델 | MODIFIED | `mentionedEntities Json?` 컬럼 추가 (nullable, 하위 호환) |

**핵심 아키텍처 결정 4가지:**
1. **Parse on Submit**: textarea에 `@Name` 텍스트를 유지하고 submit 시에만 멘션 파싱 — contenteditable 불필요
2. **System Prompt Injection**: 엔티티 데이터를 `messages[]`가 아닌 `system` 파라미터로 주입 — 히스토리 오염 방지
3. **Server-side Resolution**: 클라이언트는 ID 전송, 서버에서 RBAC 포함 데이터 조회 — PII 보호
4. **GET Route for Autocomplete**: AbortController 취소 지원을 위해 Server Action 대신 GET route 사용

**빌드 순서 (의존성 기반, 13단계):**
1. `mention-types.ts` → 2. Prisma 스키마 + 마이그레이션 → 3. `mention-resolver.ts` → 4. `context-builder.ts` → 5. `/api/chat/mentions/search` route → 6. `/api/chat/route.ts` 수정 → 7. `use-mention.ts` → 8. `MentionTag` → 9. `MentionDropdown` → 10. `ChatInput.tsx` 수정 → 11. `useChatStream.ts` 수정 → 12. `ChatPage.tsx` 수정 → 13. `ChatMessageItem.tsx` 수정

### Critical Pitfalls

1. **토큰 예산 초과 (CRITICAL)** — Prisma `include` 전체 JOIN 대신 `select`로 필드 단위 제한 필수. 학생 1명당 1,000 토큰 미만 목표, MVP 권장값 ~800 토큰. Phase 1 context-builder 설계 시 토큰 예산 정의 선행 필수.

2. **RBAC 없는 엔티티 조회 (CRITICAL — 보안)** — `verifySession()`만으로 불충분. `getRBACPrisma(session)` 또는 명시적 `teamId` WHERE 조건 필수. TEACHER 역할은 본인 팀 학생만 조회 가능. 자동완성 GET route와 멘션 해석 API 양쪽 모두 적용.

3. **Indirect Prompt Injection (HIGH — 보안, OWASP LLM Top 10 #1)** — 상담 노트 등 자유 텍스트 필드가 system prompt에 그대로 주입 시 LLM 행동 조작 가능. XML 경계 마커(`<student_data>`) 사용 + system prompt 상단에 "외부 데이터 지시문 무시" 명시.

4. **멘션 컨텍스트 히스토리 누적 (HIGH)** — 엔티티 데이터를 `ChatMessage.content`에 저장하면 멀티턴 히스토리 재전송 시 토큰이 턴마다 누적 증가. DB에는 원본 텍스트(`@홍길동 성적 어때?`)만 저장, system prompt는 매 요청 시 현재 멘션만으로 동적 생성.

5. **자동완성 N+1 + 커서 위치 리셋 (MEDIUM)** — 검색 API에 200ms 디바운스 + AbortController 취소 + `Promise.all()` 병렬 쿼리 필수. 멘션 삽입 후 React controlled input의 selection state 리셋 문제는 `requestAnimationFrame`으로 커서 위치 복원.

---

## Implications for Roadmap

### Phase 1: 서버 사이드 핵심 구축 (Foundation)

**Rationale:** 보안과 데이터 계층을 먼저 구축해야 UI 작업이 안전하게 진행된다. 모든 Critical Pitfall(RBAC, 토큰 예산, Prompt Injection, 히스토리 누적)이 이 Phase에서 예방되어야 한다. UI가 없어도 curl로 독립 테스트 가능한 계층.

**Delivers:**
- 타입 정의 파일 `mention-types.ts`
- Prisma 스키마 변경 (`ChatMessage.mentionedEntities Json?`) + 마이그레이션
- `mention-resolver.ts` — RBAC 포함 엔티티 데이터 조회 (학생/선생님/팀)
- `context-builder.ts` — 토큰 예산 제한 + XML 경계 마킹 + Prompt Injection 방어 포함
- `/api/chat/route.ts` 수정 — mentions[] 수신, dynamic system prompt 주입

**Addresses:** @학생 → 시스템 프롬프트 데이터 주입 (이 마일스톤의 핵심 목적)
**Avoids:** Pitfall 1 (토큰 초과), Pitfall 2 (RBAC 누락), Pitfall 3 (Prompt Injection), Pitfall 4 (히스토리 누적)

---

### Phase 2: 자동완성 검색 API (Search Layer)

**Rationale:** UI 구현 전 독립적으로 구축 및 테스트 가능한 검색 레이어. Phase 1의 타입 정의에 의존하지만 Phase 3 UI와는 독립. curl + Postman으로 완전 검증 후 Phase 3 진행.

**Delivers:**
- `/api/chat/mentions/search` GET route — RBAC 포함 학생/선생님/팀 검색
- `Promise.all()` 병렬 쿼리, `startsWith` 인덱스 활용, 결과 수 제한 적용
- 최소 2자 이상 쿼리만 검색 처리

**Uses:** Prisma (기존), `verifySession` + RBAC 패턴 (기존)
**Avoids:** Pitfall 5 N+1 및 rate limit 부재

---

### Phase 3: 자동완성 UI 및 ChatInput 통합 (Client Layer)

**Rationale:** Phase 1, 2 서버 계층 완료 후 클라이언트 레이어 구축. `pnpm add react-mentions-ts@5.4.7` 실행 후 진행. Tailwind v4 통합 스파이크를 Phase 3 첫 Task로 배치해 리스크 조기 검증.

**Delivers:**
- `use-mention.ts` 훅 — 자동완성 상태 + 200ms 디바운스 페치 + AbortController 취소
- `MentionTag` 컴포넌트 — 칩 렌더링
- `MentionDropdown` 컴포넌트 — 자동완성 UI (기존 unassigned-student-combobox Command/Popover 패턴 재사용)
- `ChatInput.tsx` 수정 — MentionTextarea 통합, `onSend(prompt, mentions[], providerId?)` 시그니처 변경
- `useChatStream.ts` 수정 — mentions[] POST body 전달
- `ChatPage.tsx` 수정 — `activeMentions` 상태 관리

**Avoids:** Pitfall 5 커서 위치 리셋 (`requestAnimationFrame` 처리)
**Risk:** react-mentions-ts + shadcn/ui Tailwind v4 통합 — 스파이크 테스트 후 @ariakit/react fallback 결정

---

### Phase 4: 메시지 렌더링 + UX 완성 (Polish)

**Rationale:** 채팅 기능은 Phase 3에서 완전히 동작. 이 Phase는 대화 히스토리의 시각적 완성도를 높인다. 기능 검증 후 추가해도 늦지 않는 순수 UI 레이어.

**Delivers:**
- `ChatMessageItem.tsx` 수정 — `mentionedEntities` 메타데이터로 `@Name` 패턴을 `MentionTag` 칩으로 교체
- 스트리밍 중 @타이핑 시 드롭다운 비활성화 (`isStreaming` 연동)
- "일치하는 학생 없음" 드롭다운 메시지
- 드롭다운 뷰포트 위치 동적 결정 (하단 잘림 방지)

---

### Phase 5: v1.x 확장 (Post-validation Extensions)

**Rationale:** MVP 검증 후 MentionInput 컴포넌트를 재사용하는 확장. 단독 Phase로 분리해 MVP 배포 → 피드백 → 확장 사이클 유지.

**Delivers:**
- LLMQueryBar @멘션 지원 (Phase 3에서 만든 MentionInput 재사용, 코드량 최소)
- 복수 학생 동시 멘션 처리 (Phase 1 mention-resolver 확장)
- 드롭다운에 학년/학교 서브레이블 표시

---

### Phase Ordering Rationale

- **보안 우선**: RBAC와 Prompt Injection 방어가 Phase 1에 집중. 이후 Phase에서 보안을 소급 추가하는 것은 데이터 노출 위험과 재작업 비용이 크다.
- **서버 → 클라이언트 순서**: curl 테스트 가능한 서버 계층 완성 후 UI 진행. Phase 1~2 완료 후 독립적 통합 테스트 가능하여 Phase 3 시작 전 신뢰도 확보.
- **의존성 기반 순서**: `mention-types.ts` → 스키마 → resolver → builder → route → UI 훅 → UI 컴포넌트. 이 순서를 역으로 하면 타입 오류와 재작업 발생.
- **UI 마지막**: 메시지 렌더링(Phase 4)은 채팅 동작과 독립적. 기능 검증 후 추가해도 늦지 않음.
- **확장은 별도 Phase**: LLMQueryBar 등 v1.x 기능은 MVP 검증 후 Phase 5로 분리.

### Research Flags

**Phase 1 — Standard patterns (research-phase 불필요):**
- Prisma `select` 패턴, Vercel AI SDK `system` 파라미터: 공식 문서로 HIGH confidence 확인됨
- RBAC 패턴: 기존 `getRBACPrisma`, `src/lib/actions/student/detail.ts` 패턴 직접 재사용 가능

**Phase 2 — Standard patterns (research-phase 불필요):**
- Next.js App Router GET route: 표준 패턴, 추가 연구 불필요

**Phase 3 — 실행 시 검증 필요 (경미한 리스크):**
- `react-mentions-ts` + shadcn/ui Tailwind v4 통합: 라이브러리 문서는 호환 선언하나 third-party 통합 리포트 부재. **Phase 3 첫 번째 Task에서 스파이크 테스트 필수.** 실패 시 @ariakit/react fallback으로 즉시 전환.
- 한국어 IME 입력 (`compositionstart`/`compositionend`)과 @ 트리거 감지 충돌 가능성: 실제 테스트 필요.

**Phase 4, 5 — Standard patterns (research-phase 불필요):**
- regex 기반 텍스트 → 칩 치환: React 표준 패턴
- 컴포넌트 재사용: Phase 3 산출물 재활용

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm으로 직접 확인, peer deps 기존 설치 확인됨. react-mentions-ts Tailwind v4 통합만 MEDIUM |
| Features | HIGH | Notion AI, Slack, Cursor 교차 검증. 도메인 특화 우선순위는 교육 AI 연구 논문으로 보강 |
| Architecture | HIGH | 기존 소스코드 직접 분석 기반. 모든 통합 포인트 실제 코드에서 확인됨 |
| Pitfalls | HIGH | OWASP 공식 문서, 기존 codebase RBAC 패턴 직접 분석, React controlled input 알려진 동작 기반 |

**Overall confidence:** HIGH

### Gaps to Address

- **react-mentions-ts 실제 통합 검증**: 문서상 Tailwind v4 호환 선언이나 shadcn/ui 환경에서의 실제 렌더링 검증 필요. Phase 3 첫 Task에서 스파이크 구현으로 해소. 문제 시 @ariakit/react 즉시 전환.
- **한국어 IME + @트리거 충돌**: `compositionstart` 이벤트 발생 시 @를 타이핑해도 드롭다운이 열리지 않아야 함. 기존 코드베이스에 IME 처리 사례가 없으므로 Phase 3에서 실제 테스트 필요.
- **토큰 추정 정확도**: 한국어 기준 1토큰 ≈ 1.5~2자로 추정했으나 모델별로 다를 수 있음. Phase 1 context-builder 구현 시 실제 토큰 카운트 측정 후 예산 조정.
- **LLMQueryBar 기존 구조**: Phase 5 구현 시 `src/components/layout/llm-query-bar.tsx`의 현재 props 인터페이스 사전 확인 필요.

---

## Sources

### Primary (HIGH confidence)
- `src/app/api/chat/route.ts` 직접 분석 — 기존 시스템 프롬프트 패턴, 요청 바디 구조 확인
- `src/lib/ai/universal-router.ts` 직접 분석 — `streamWithProvider(system?: string)` 시그니처 확인
- `src/components/chat/chat-input.tsx`, `chat-page.tsx`, `chat-message-item.tsx` — 기존 onSend 시그니처 확인
- `src/hooks/use-chat-stream.ts` — `SendMessageOptions` 타입, fetch 구현 확인
- `prisma/schema.prisma` — ChatMessage 모델, Student 인덱스, 모든 분석 모델 확인
- `src/lib/db/common/rbac.ts`, `src/lib/dal.ts` — RBAC 패턴 직접 확인
- `npm info react-mentions-ts` — v5.4.7, peer deps 확인 (zero additional deps)
- [Vercel AI SDK Prompts Docs](https://ai-sdk.dev/docs/foundations/prompts) — system 파라미터 동적 사용 확인
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — Indirect Prompt Injection #1 확인

### Secondary (MEDIUM confidence)
- [react-mentions-ts GitHub](https://github.com/hbmartin/react-mentions-ts) — React 19 네이티브, Tailwind v4 ready 선언
- [Notion AI @mention 공식 도움말](https://www.notion.com/help/notion-ai-faqs) — 선택적 컨텍스트 패턴 확인
- [Education AI RAG patterns — Nature 2025](https://www.nature.com/articles/s41598-025-19159-4) — 도메인 특화 컨텍스트 주입 효과
- [Ariakit combobox-textarea example](https://ariakit.org/examples/combobox-textarea) — fallback 패턴 레퍼런스

### Tertiary (LOW confidence — needs validation during execution)
- react-mentions-ts + shadcn/ui Tailwind v4 실제 통합 사례: 미발견. Phase 3 스파이크로 직접 검증 필요.

---

*Research completed: 2026-02-18*
*Ready for roadmap: yes*
