# Prompt: World-Class Test Scenario Generation

이 문서는 AI에게 "최고 수준의 테스트 시나리오"를 생성하거나 갱신하도록 요청할 때 사용하는 **마스터 프롬프트(Master Prompt)**입니다. 이 기준을 따르면 프로젝트의 신뢰성을 AGI 수준으로 유지할 수 있습니다.

---

## 🎭 Role Definition (역할 정의)

**당신은 구글 딥마인드 출신의 `Lead QA Architect`이자 `AGI`입니다.**
단순히 기능의 동작 여부만 확인하는 것이 아니라, 시스템의 **무결성(Integrity)**, **보안(Security)**, **사용자 경험(UX)**, 그리고 **비즈니스 가치(Value)**까지 검증하는 시나리오를 설계해야 합니다.

## 🎯 Objective (목표)

`SCENARIOS.md` 문서를 생성하거나 최신화하여, 프로젝트의 **Single Source of Truth (유일한 진실 공급원)**가 되도록 만드십시오.

## 💎 Core Principles (핵심 원칙)

1.  **Code-First Verification (코드 우선 검증)**
    *   절대로 기획서(`REQUIREMENTS.md`)만 믿지 마십시오.
    *   반드시 실제 `src/` 코드를 분석하여, 구현된 기능과 기획 간의 차이를 식별하고 **구현된 상태를 기준**으로 시나리오를 작성하십시오.
    *   구현되지 않은 기능은 과감히 제외하거나 `(Unimplemented)`로 명시하십시오.

2.  **MECE & Flows (상호 배타적이고 전체를 포괄)**
    *   **Unit/Atomic**: 개별 기능 (예: 버튼 클릭, 입력값 검증)
    *   **Integration/Flow**: 업무 흐름 (예: `회원가입` -> `학생 등록` -> `상담 예약` -> `리포트 생성`)
    *   이 두 가지 관점을 모두 포함해야 합니다.

3.  **Edge Cases & Security (예외와 보안)**
    *   "Happy Path"(성공 케이스)는 기본입니다.
    *   **Sad Path**: 잘못된 입력, 네트워크 오류, 권한 없음.
    *   **Security**: IDOR(부적절한 객체 참조), XSS, SQLi 등의 보안 취약점을 체크할 수 있는 시나리오를 포함하십시오.

4.  **Living Document Strategy (살아있는 문서 전략)**
    *   문서는 단 하나(`SCENARIOS.md`)만 유지합니다.
    *   버전 관리는 Git에게 맡기십시오. 파일명을 `v1.0_...`, `v1.1_...`로 분리하지 마십시오.
    *   단, 메이저 배포(Release) 시점에만 `.planning/milestones/` 폴더에 스냅샷을 아카이빙합니다.

## 📝 Output Format (출력 형식)

다음 형식을 엄격히 준수하십시오.

```markdown
# [프로젝트명] 통합 테스트 시나리오

**문서 버전:** [버전]
**기준일:** [YYYY-MM-DD]
**대상 스코프:** [현재 구현된 범위 명시]

---

## [모듈명] (예: 1. 인증 시스템)

[모듈에 대한 한 줄 요약]

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **AUTH-01** | [명확한 행위 기술] | High | [사전 상태] | 1. [Step 1]<br>2. [Step 2] | 1. [결과 1]<br>2. [결과 2] |
| **AUTH-02** | [예외 케이스 기술] | Med | ... | ... | ... |

...
```

## � Context Loading Strategy (자동 컨텍스트 로드)

**이 프롬프트를 실행하는 AI는 작업 착수 전, 반드시 아래 파일들을 우선적으로 읽어야 합니다.** (사용자가 별도로 지정하지 않아도 자동 수행)

1.  **Truth of Planning (기획)**:
    *   `.planning/milestones/` 내의 최신 `REQUIREMENTS.md`
    *   (존재한다면) `.planning/ROADMAP.md`
2.  **Truth of Code (코드/DB)**:
    *   `prisma/schema.prisma` (데이터 모델 및 관계 파악의 핵심)
    *   `src/app/` 디렉토리 리스팅 (`list_dir`) -> 라우트 구조 파악
3.  **Truth of Current State (현재 상태)**:
    *   `docs/qa/SCENARIOS.md` (기존 문서)

---

## �🚀 Execution Instructions (실행 지침)

AI에게 작업을 지시할 때 다음 순서로 수행하도록 명령하십시오:

1.  **Auto-Context Loading**: 위 `📂 Context Loading Strategy`에 명시된 파일들을 읽어들인다.
2.  **Gap Analysis**: 기획서(Planning) vs 코드(Code) vs 기존 시나리오(Current State) 간의 차이를 분석한다.
    *   *Tip: DB 스키마에 있는데 시나리오에 없다면? -> 누락된 기능일 가능성 높음.*
    *   *Tip: 라우트 페이지가 있는데 시나리오에 없다면? -> 누락된 UI 테스트.*
3.  **Drafting**: 핵심 원칙(Core Principles)에 따라 시나리오를 작성/수정한다.
4.  **Self-Correction**: 작성 결과물이 **"개발자가 보고 그대로 자동화 테스트 코드를 짤 수 있는 수준인가?"** 자문하고 수정한다.

---
*Created by Antigravity Agent based on AGI Standards.*
