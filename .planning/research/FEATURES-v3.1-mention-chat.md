# Feature Research

**Domain:** @mention 기반 컨텍스트 인젝션 채팅 시스템 (AI AfterSchool)
**Researched:** 2026-02-18
**Confidence:** HIGH (Notion AI, Cursor, Slack/Discord 패턴 교차 검증 완료)

---

## 기존 채팅 시스템 현황

이 마일스톤은 신규 시스템이 아닌 **기존 채팅에 @멘션 레이어를 추가**하는 작업이다.
이미 구축된 것:

| 컴포넌트 | 위치 | 상태 |
|---------|------|------|
| ChatSession / ChatMessage 모델 | prisma/schema.prisma | 완료 |
| 스트리밍 API | src/app/api/chat/route.ts | 완료 |
| 멀티턴 컨텍스트 (최근 20개) | route.ts | 완료 |
| ChatInput (plain textarea) | src/components/chat/chat-input.tsx | 완료 — 교체 필요 |
| 다중 프로바이더 선택 | chat-input.tsx | 완료 |
| ChatSidebar / 세션 목록 | chat-sidebar.tsx | 완료 |
| LLMQueryBar (대시보드 헤더) | llm-query-bar.tsx | 완료 — @멘션 추가 필요 |
| 고정 시스템 프롬프트 | route.ts 하드코딩 | 완료 — 동적 교체 필요 |

---

## Feature Landscape

### Table Stakes (Users Expect These)

사용자가 @멘션 기반 채팅에서 당연하게 기대하는 기능들. 없으면 제품이 미완성으로 느껴진다.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| @ 타이핑 시 자동완성 드롭다운 | Slack, Discord, Notion 모두 동일 패턴 — 업계 표준 | MEDIUM | @ 입력 후 즉시 엔티티 목록 표시 |
| 이름 기반 퍼지 검색 필터링 | 타이핑할수록 목록 좁혀지는 것 기대 | MEDIUM | "홍" 입력 → "홍길동" 매칭 |
| 키보드 네비게이션 (↑↓ 선택, Enter 확정, Esc 닫기) | 모든 성숙한 멘션 구현의 필수 UX | LOW | 마우스 없이 완전 조작 가능해야 함 |
| 확정된 @멘션의 시각적 표시 (칩/태그 형태) | 사용자가 "무엇이 참조됐는지" 확인 필요 | MEDIUM | 파란색 배지, 클릭으로 제거 가능 |
| @학생이름 → 해당 학생 데이터를 시스템 프롬프트에 주입 | 이 기능이 전체의 핵심 목적 | HIGH | API 레이어에서 처리 |
| @teacher (@선생님) → 선생님 프로필 데이터 주입 | 학생과 동일한 기대 | MEDIUM | 현재 로그인 선생님 본인 또는 타 선생님 |
| @team (@학급) → 학급 전체 통계 주입 | 팀 단위 질문 지원 | MEDIUM | "우리 반 평균 사주 특성은?" |
| 참조된 엔티티가 메시지에 시각적으로 표시 | 대화 히스토리에서 맥락 파악 | LOW | 메시지 렌더링 시 @이름 하이라이트 |
| 컨텍스트 없이도 일반 채팅 계속 동작 | @멘션 없이 기존 채팅처럼 사용 가능 | LOW | 하위 호환 — 기존 기능 퇴행 없음 |

**근거:**
- Notion AI: "@-mention people or pages to narrow things down" — 공식 Notion 도움말
- Slack: "@ 심볼로 사람, 그룹, 앱 검색" — 업계 표준으로 확립
- CSS-Tricks @mention 구현 가이드: 패널은 토큰이 아닌 단어가 되면 닫힘
- Cursor IDE: @ 심볼이 파일/문서 참조 드롭다운 트리거 — 동일 패턴

---

### Differentiators (Competitive Advantage)

이 도메인(학원 AI 채팅)에서 차별화되는 기능들. 없어도 불완전하지 않지만, 있으면 가치가 크다.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 데이터 타입 선택적 주입 (@홍길동:사주, @홍길동:MBTI) | 토큰 절약 + 관련 없는 데이터 제외로 응답 품질 향상 | HIGH | v1에서는 전체 프로필 주입으로 시작, 이후 선택적으로 |
| 복수 학생 동시 멘션 (궁합 질문) | "이미 구현된 궁합(CompatibilityResult)과 자연어 채팅 연결" | HIGH | "@홍길동 @이순신 궁합 어때?" — 두 학생 데이터 동시 주입 |
| 주입 데이터 선택 UI (드롭다운 서브메뉴) | 선생님이 어떤 데이터가 참조됐는지 제어 | HIGH | 구현 복잡도 높음, 차후 마일스톤 권장 |
| 메시지에 참조 데이터 출처 배지 표시 | "이 답변은 @홍길동의 사주 데이터 기반" 신뢰도 | MEDIUM | AI 응답 신뢰성 향상 |
| 세션에 멘션된 엔티티 목록 기록 (ChatSession.mentionedEntities) | 나중에 "어떤 학생 상담했나" 조회 가능 | MEDIUM | DB 스키마 마이그레이션 필요 |
| @학생이름 자동완성에서 학생 기본정보 미리보기 | 동명이인 구분, 빠른 확인 | MEDIUM | 학년, 학교 정보 드롭다운에 표시 |
| LLMQueryBar에서 @멘션 지원 | 대시보드 어디서나 학생 참조 가능 | MEDIUM | plain input → mention-aware input 교체 |
| 자주 참조하는 학생 최근/즐겨찾기 순 정렬 | 드롭다운 UX 개선 — 많이 쓰는 학생 상단 | LOW | 로컬 스토리지 기반 충분 |

**근거:**
- Notion AI (2024): "AI가 전체 워크스페이스를 뒤지지 않고 특정 페이지를 참조하도록 지정" — 선택적 컨텍스트 패턴 확립
- 교육 AI 시스템 연구 (Nature 2025): RAG로 도메인별 정확도 향상, hallucination 감소
- 기존 CompatibilityResult 모델: 이미 구현된 궁합 데이터를 자연어로 조회하는 자연스러운 확장

---

### Anti-Features (Commonly Requested, Often Problematic)

겉보기엔 좋아 보이지만 실제로는 문제를 만드는 기능들.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 전체 학생 목록 자동 컨텍스트 주입 | "AI가 모든 학생을 알았으면 좋겠어" | 토큰 폭발 (학생 100명 × 10개 데이터 타입 = 컨텍스트 초과), 비용 급증, 응답 품질 저하 | @멘션 명시적 참조만 — 필요한 학생만 지정 |
| 실시간 DB 조회를 스트리밍 중에 수행 | "항상 최신 데이터 반영" | 스트리밍 도중 추가 DB 쿼리는 지연 발생, 구현 복잡도 높음 | 메시지 전송 시점에 스냅샷 조회 후 주입 |
| @멘션마다 별도 AI 호출 (에이전트 체인) | "각 멘션을 자동으로 분석해줘" | 지연 × 멘션 수, 비용 × 멘션 수, UX 불예측성 | 단일 LLM 호출에 모든 멘션 데이터를 컨텍스트로 통합 |
| 학생 전체 데이터를 항상 첨부 (사주+MBTI+관상+손금+상담기록+궁합 전부) | "AI가 더 잘 알수록 좋지 않나" | 단일 학생도 2,000~5,000 토큰, 10명이면 컨텍스트 한도 초과 | 데이터 타입별 선택적 주입 or 핵심 데이터만 요약 주입 |
| @멘션 자동 완성에서 벡터 검색 (의미론적 매칭) | "이름 몰라도 특징으로 찾고 싶어" | 구현 복잡도 폭발, 지연 증가, 이 시스템에서 불필요 | 단순 이름 부분 문자열 검색으로 충분 |
| 리치 텍스트 에디터 전면 도입 (Tiptap/ProseMirror) | 멘션 구현에 자주 권장 | 기존 plain textarea 교체 시 스트리밍 UI 전면 재작성, bundle 크기 증가, 현 시스템 오버엔지니어링 | 기존 textarea 위에 오버레이 드롭다운 패턴 — tribute.js나 커스텀 구현 |

**핵심 안티패턴:** Tiptap/ProseMirror 도입
- 기존 `ChatInput`은 단순 textarea + streaming display 구조
- Tiptap은 rich text editor로, 스트리밍 응답 표시와 충돌 발생 가능
- ChatInput은 입력 전용, 응답은 ChatMessageList에서 렌더링 — 역할 분리 유지
- 간단한 오버레이 드롭다운이 훨씬 적합

---

## Feature Dependencies

```
[@ 타이핑 감지 로직]
    └──requires──> [MentionInput 컴포넌트 (ChatInput 교체)]
                       └──requires──> [엔티티 검색 API or Server Action]
                                          └──requires──> [기존 Student/Teacher/Team DB 모델 ✓ (이미 존재)]

[시스템 프롬프트 동적 주입]
    └──requires──> [멘션된 엔티티 목록 파싱 (API 레이어)]
                       └──requires──> [엔티티별 데이터 조회 함수]
                                          └──requires──> [기존 SajuAnalysis, MbtiAnalysis 등 ✓]

[복수 엔티티 동시 멘션] ──requires──> [@ 타이핑 감지 로직] (선행 필요)
[세션 멘션 기록] ──requires──> [ChatSession 스키마 마이그레이션]
[데이터 타입 선택적 주입] ──requires──> [기본 @멘션 구현] (선행 필요)
[LLMQueryBar @멘션] ──requires──> [MentionInput 컴포넌트] (재사용)
```

### Dependency Notes

- **@ 타이핑 감지는 MentionInput이 선행**: ChatInput을 @감지 가능한 컴포넌트로 교체해야 드롭다운, 주입 모두 가능
- **엔티티 데이터 조회는 기존 모델 재사용**: SajuAnalysis, MbtiAnalysis, PersonalitySummary 등 이미 구현됨 — 새 조회 함수만 작성
- **LLMQueryBar는 MentionInput 재사용**: 독립 구현 불필요, 동일 컴포넌트 적용
- **데이터 타입 선택적 주입과 세션 멘션 기록은 v1 이후로 연기 가능**: 기본 전체 프로필 주입으로 MVP 검증 후 추가

---

## MVP Definition

### Launch With (v1) — 마일스톤 첫 배포

최소 기능으로 핵심 가치 검증: "AI 채팅에서 학생 이름을 @로 부르면 그 학생 데이터 기반 답변을 받는다"

- [ ] **MentionInput 컴포넌트** — 기존 ChatInput의 textarea를 @감지 textarea로 교체. @ 입력 시 드롭다운 표시, 선택 시 칩 형태로 삽입
- [ ] **엔티티 자동완성 API** — 학생명 부분 검색 Server Action (Student, Teacher, Team)
- [ ] **@학생 → 데이터 주입** — API 레이어에서 멘션 파싱 후 Student의 핵심 프로필 + 최신 사주/MBTI/성명학 요약을 시스템 프롬프트에 추가
- [ ] **시각적 칩 표시** — 확정된 @멘션이 입력창에 파란색 배지로 표시됨
- [ ] **키보드 UX** — ↑↓ 탐색, Enter 확정, Esc 닫기

### Add After Validation (v1.x) — 검증 후 추가

- [ ] **LLMQueryBar @멘션** — 대시보드 헤더 빠른 입력창에도 동일 @멘션 지원 추가 (MentionInput 재사용)
- [ ] **복수 학생 동시 멘션** — 한 메시지에 @학생A @학생B 동시 참조 (궁합 질문 등)
- [ ] **메시지 히스토리에 @멘션 하이라이트** — 대화 기록에서 @이름을 파란색으로 렌더링
- [ ] **자동완성 드롭다운에 학생 미리보기** — 학년, 학교 정보 표시로 동명이인 구분

### Future Consideration (v2+) — 차후 마일스톤

- [ ] **데이터 타입 선택적 주입** (@홍길동:사주, @홍길동:MBTI) — 토큰 최적화, UI 복잡도 높음
- [ ] **세션 멘션 기록 (DB)** — ChatSession에 mentionedEntities 컬럼 추가로 상담 이력 추적
- [ ] **주입 데이터 요약 압축** — 전체 JSON 대신 LLM이 요약한 자연어 프로필 주입으로 토큰 절약
- [ ] **참조 엔티티 배지 (응답 하단)** — AI 응답에 "이 답변은 홍길동의 사주 데이터 기반" 출처 표시

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| @ 타이핑 시 자동완성 드롭다운 | HIGH | MEDIUM | P1 |
| 키보드 네비게이션 | HIGH | LOW | P1 |
| 확정 @멘션 칩 시각적 표시 | HIGH | MEDIUM | P1 |
| @학생 → 시스템 프롬프트 데이터 주입 | HIGH | HIGH | P1 |
| @teacher/@team 지원 | MEDIUM | LOW | P1 (학생과 동일 구조) |
| 자동완성 미리보기 (학년/학교) | MEDIUM | LOW | P2 |
| LLMQueryBar @멘션 | MEDIUM | LOW | P2 (MentionInput 재사용) |
| 복수 멘션 동시 주입 | HIGH | MEDIUM | P2 |
| 메시지 히스토리 @멘션 하이라이트 | LOW | LOW | P2 |
| 데이터 타입 선택적 주입 | HIGH | HIGH | P3 |
| 세션 멘션 기록 (DB) | MEDIUM | MEDIUM | P3 |
| 주입 데이터 요약 압축 | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: 이 마일스톤 MVP에 필수
- P2: 검증 후 추가, 같은 마일스톤 내 후속 작업
- P3: 다음 마일스톤으로 연기

---

## 기존 데이터와의 연결 매핑

@멘션 시 주입 가능한 데이터와 기존 Prisma 모델:

| @엔티티 타입 | 주입할 데이터 | 기존 모델 | 토큰 추정 |
|------------|-------------|---------|---------|
| @학생 | 기본 프로필 (이름, 학교, 학년, 생년월일) | Student | ~100 토큰 |
| @학생 + 사주 | SajuAnalysis.result (요약) | SajuAnalysis | ~300 토큰 |
| @학생 + MBTI | MbtiAnalysis.mbtiType + interpretation | MbtiAnalysis | ~200 토큰 |
| @학생 + 성명학 | NameAnalysis.result (요약) | NameAnalysis | ~200 토큰 |
| @학생 + 통합분석 | PersonalitySummary.coreTraits + learningStrategy | PersonalitySummary | ~400 토큰 |
| @학생 + 상담기록 | CounselingSession 최근 3건 요약 | CounselingSession | ~600 토큰 |
| @학생 전체 | 위 모두 합산 | 다수 | ~1,800 토큰 |
| @선생님 | 기본 프로필 + 사주 | Teacher + TeacherSajuAnalysisHistory | ~300 토큰 |
| @학급 | Team 구성원 목록 + 기본 통계 | Team + Student[] | ~500 토큰 |

**MVP 권장:** @학생 멘션 시 기본 프로필 + PersonalitySummary + 최신 SajuAnalysis 요약 (총 ~800 토큰) 주입.
전체 데이터 주입은 토큰 낭비. 선택적 주입은 v2로 연기.

---

## Competitor Feature Analysis

이 도메인에 직접적인 경쟁자가 없으므로 @멘션 패턴 구현 레퍼런스로 분석.

| Feature | Notion AI | Cursor IDE | Slack | Our Approach |
|---------|-----------|------------|-------|--------------|
| @트리거 | @ 입력 | @ 입력 | @ 입력 | @ 입력 (동일) |
| 자동완성 대상 | 페이지/사람/날짜 | 파일/문서/심볼 | 사람/채널/앱 | 학생/선생님/학급 |
| 선택 후 표시 | 파란색 링크 | 파란색 칩 | @이름 텍스트 | 파란색 칩 (배지) |
| 데이터 주입 방식 | 페이지 내용 첨부 | 파일 코드 첨부 | 알림 전달 | 시스템 프롬프트 동적 구성 |
| 공백 처리 | 공백 포함 검색 | 이스케이프 처리 | 공백 포함 검색 | 공백 포함 이름 검색 (한국어 이름) |
| 복수 참조 | 가능 | 가능 | 가능 | v1.x에서 지원 |

---

## 구현 접근법 권장

### 입력 컴포넌트 전략

**권장: 커스텀 오버레이 패턴 (Tiptap 미사용)**

```
ChatInput (기존 textarea)
    → MentionAwareChatInput (새 컴포넌트)
        ├── textarea (기존 유지 — Tiptap 미도입)
        ├── MentionDropdown (절대 위치 오버레이)
        └── MentionChipList (선택된 엔티티 배지들)
```

이유:
1. 기존 streaming 표시 아키텍처와 충돌 없음
2. Tiptap bundle 미추가 (~150KB 절약)
3. 기존 ChatInput props (`onSend`, `isStreaming`) 인터페이스 유지
4. 한국어 IME 입력 처리 (compositionstart/compositionend) 직접 제어 가능

### API 레이어 전략

```
POST /api/chat
    → 기존 body: { prompt, providerId, sessionId, messages }
    → 추가: { mentions: [{ type: 'student'|'teacher'|'team', id: string }] }
    → 서버에서 mentions로 데이터 조회 후 system prompt에 주입
    → 기존 SYSTEM_PROMPT는 베이스로 유지, 멘션 데이터 appendix로 추가
```

---

## Sources

- [Notion AI @mention 공식 도움말](https://www.notion.com/help/notion-ai-faqs) — HIGH confidence
- [September 25, 2024 Notion AI Update — selective context](https://www.notion.com/releases/2024-09-25) — HIGH confidence
- [CSS-Tricks: @mention 자동완성 구현](https://css-tricks.com/so-you-want-to-build-an-mention-autocomplete-feature/) — HIGH confidence (구현 패턴 레퍼런스)
- [Tiptap Mention Dropdown — 공식 문서](https://tiptap.dev/docs/ui-components/components/mention-dropdown-menu) — HIGH confidence (안티패턴 근거로 확인)
- [Algolia: Rich text box with mentions](https://www.algolia.com/doc/ui-libraries/autocomplete/solutions/rich-text-box-with-mentions-and-hashtags) — MEDIUM confidence
- [Cursor IDE @mention 파일 참조 패턴](https://learn-cursor.com/en/wiki/user-guide/code-completion) — MEDIUM confidence
- [Education AI RAG patterns — Nature 2025](https://www.nature.com/articles/s41598-025-19159-4) — MEDIUM confidence

---

*Feature research for: @mention 기반 컨텍스트 인젝션 채팅 — AI AfterSchool v3.1*
*Researched: 2026-02-18*
