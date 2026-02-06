# AI QA 파이프라인: 탄생과 실행의 역사 (Analysis Report)

**작성일:** 2026-02-06
**분석 대상:** `ai-afterschool/docs/qa/*` 및 관련 스크립트

---

## 1. 탄생의 기원 (Origin)

이 시스템은 **2026년 2월 5일**, 커밋 `a64f9a9` ("fix: Auth 테스트 수정 완료") 시점에 하나의 **"완전한 패키지"**로 프로젝트에 도입되었습니다.

당시 AI 에이전트(Antigravity)는 단순한 테스트 코드 작성을 넘어, **"살아있는 자동화 검증 시스템(Living QA System)"**을 구축하고자 했습니다. 이를 위해 세 가지 문서가 유기적으로 연결되어 동시에 생성되었습니다.

### 🔗 삼위일체 구조 (The Trinity)
1.  **`MASTER_PROMPT.md` (헌법/페르소나)**
    *   **역할:** AI에게 "Google Deepmind 출신 Lead QA Architect"라는 **페르소나**를 부여.
    *   **원칙:** "기획서만 믿지 말고 코드를 봐라(Code-First)", "Happy Path뿐만 아니라 Sad Path를 챙겨라" 등의 핵심 규범 정의.
2.  **`SCENARIOS.md` (법률/콘텐츠)**
    *   **역할:** 위 원칙에 따라 작성된 **실제 테스트 시나리오**.
    *   **특징:** 사람이 읽는 문서임과 동시에, 기계(AI Script)가 읽고 코드로 변환하기 쉽도록 구조화됨.
3.  **`AI_QA_PIPELINE_DESIGN.md` (집행/시스템)**
    *   **역할:** 이 시나리오를 어떻게 지속적으로 실행할 것인가에 대한 **실행 설계서**.
    *   **핵심:** GitHub Actions와 Playwright를 연동하여 "수정 -> 테스트 -> 자동복구(Auto-Fix)" 루프 제안.

---

## 2. 실행의 비밀 (The Execution Secret)

단순히 문서를 쓴 것이 아니라, 실제 **TypeScript 코드(`tests/e2e/*.spec.ts`)로 변환**되는 과정이 포함되어 있었습니다. 이 과정은 **`scripts/qa/generate-tests.ts`** 스크립트에 의해 자동화되었으며, 내부적으로 **동적 프롬프트 엔지니어링**이 사용되었습니다.

### ⚡ 2-Phase Prompting Strategy

스크립트는 테스트 생성을 위해 두 단계의 과정을 거쳤습니다.

#### **Phase 1: Planning (설계)**
*   **목표:** 방대한 시나리오를 보고 "어떤 파일들"을 만들어야 할지 결정.
*   **내부 프롬프트:**
    > "You are a Lead QA Engineer. Analyze the provided validation scenarios and determine the necessary Playwright test files (.spec.ts)... Return ONLY a JSON array of filenames."

#### **Phase 2: Generation (구현)**
*   **목표:** 각 파일별 실제 Playwright 코드 생성.
*   **내부 프롬프트:**
    > "You are a Playwright Expert. Generate the Code for the file '${filename}' based on the scenarios.
    > - Use standard Playwright/TypeScript patterns.
    > - Include comments referencing Scenario IDs (e.g. AUTH-01).
    > - Return ONLY the code."

---

## 3. 결론 (Summary)

이 프로젝트의 QA 파이프라인은 파편화된 문서가 아니라, **[Role Definition -> Scenario Authoring -> Automated Code Generation]**으로 이어지는 치밀하게 설계된 **AI-Native Workflow**의 산물입니다.

*   **설계자:** Antigravity Agent (2026-02-05)
*   **구현체:** `scripts/qa/generate-tests.ts`
*   **결과물:** 4,000줄 이상의 `src/tests/e2e` 테스트 코드
