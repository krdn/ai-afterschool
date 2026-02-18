# Requirements: AI AfterSchool v4.0

**Defined:** 2026-02-19
**Core Value:** AI 채팅에서 @멘션으로 시스템 데이터를 참조하여 맞춤형 AI 응답을 제공

## v4.0 Requirements

Requirements for v4.0 AI Smart Chat milestone. Each maps to roadmap phases.

### @멘션 인프라 (Mention Infrastructure)

- [ ] **MENT-01**: 교사가 채팅 입력창에서 @를 입력하면 학생/선생님/학급 검색 드롭다운이 표시된다
- [ ] **MENT-02**: 교사가 드롭다운에서 엔티티를 선택하면 채팅 입력에 멘션이 삽입된다
- [x] **MENT-03**: 시스템이 제출된 메시지에서 @멘션을 파싱하여 엔티티 ID/타입 목록을 추출한다
- [ ] **MENT-04**: 시스템이 멘션된 엔티티의 데이터를 DB에서 RBAC 적용하여 조회한다
- [ ] **MENT-05**: 한국어 IME 조합 중에도 자동완성이 정상 작동한다
- [ ] **MENT-06**: 학생, 선생님, 학급(팀) 3가지 엔티티 타입을 멘션할 수 있다

### 컨텍스트 주입 (Context Injection)

- [ ] **CTX-01**: 멘션된 엔티티 데이터가 AI 시스템 프롬프트에 동적으로 주입된다
- [ ] **CTX-02**: 교사는 자신의 팀에 속한 엔티티만 멘션할 수 있다 (RBAC)
- [ ] **CTX-03**: 엔티티 데이터는 토큰 예산 내로 요약되어 주입된다 (~800토큰/엔티티)
- [ ] **CTX-04**: 상담 노트 등 자유 텍스트는 경계 마킹으로 Prompt Injection을 방어한다
- [x] **CTX-05**: ChatMessage에 멘션 메타데이터가 저장된다 (mentionedEntities JSON)

### UI/UX (User Experience)

- [ ] **UI-01**: 드롭다운 자동완성이 타입별 그룹으로 표시된다 (학생/선생님/학급)
- [ ] **UI-02**: 채팅 메시지에서 멘션이 시각적 칩으로 렌더링된다
- [ ] **UI-03**: 멘션 칩 클릭 시 엔티티 프리뷰 카드가 팝오버로 표시된다
- [ ] **UI-04**: 대시보드 LLMQueryBar에서도 @멘션을 사용할 수 있다

## Future Requirements

### 세션 컨텍스트 확장 (v4.1+)

- **SESS-01**: 세션 내에서 이전에 멘션된 엔티티 데이터가 자동으로 유지된다
- **SESS-02**: 교사가 세션의 멘션 히스토리를 확인할 수 있다
- **SESS-03**: AI가 이전 멘션 컨텍스트를 기반으로 후속 질문에 연속적으로 답변한다

### 고급 멘션 기능 (v4.1+)

- **ADV-01**: 교사가 멘션 시 포함할 데이터 유형을 선택할 수 있다 (사주만, MBTI만 등)
- **ADV-02**: 복수 학생 멘션 시 비교 분석 컨텍스트가 자동 생성된다
- **ADV-03**: AI가 응답에서 참조한 데이터 소스를 표시한다

## Out of Scope

| Feature | Reason |
|---------|--------|
| 실시간 데이터 구독 (WebSocket) | 채팅 요청 시점의 스냅샷으로 충분, 실시간 불필요 |
| 파일/문서 멘션 | 엔티티(사람/팀) 멘션에 집중, 문서는 v5.0+ |
| AI 자동 멘션 제안 | 사용자 주도 멘션이 핵심, AI 자동 제안은 과도한 복잡도 |
| 멘션 기반 알림 시스템 | 채팅 컨텍스트 주입이 목표, 알림은 별도 기능 |
| Tiptap/Slate 리치 텍스트 에디터 | 150KB+ 오버헤드, 기존 Textarea + 오버레이로 충분 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MENT-01 | Phase 38 | Pending |
| MENT-02 | Phase 38 | Pending |
| MENT-03 | Phase 36 | Complete |
| MENT-04 | Phase 36 | Pending |
| MENT-05 | Phase 38 | Pending |
| MENT-06 | Phase 37 | Pending |
| CTX-01 | Phase 36 | Pending |
| CTX-02 | Phase 36 | Pending |
| CTX-03 | Phase 36 | Pending |
| CTX-04 | Phase 36 | Pending |
| CTX-05 | Phase 36 | Complete |
| UI-01 | Phase 38 | Pending |
| UI-02 | Phase 39 | Pending |
| UI-03 | Phase 39 | Pending |
| UI-04 | Phase 40 | Pending |

**Coverage:**
- v4.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 — phase assignments complete (phases 36-40)*
