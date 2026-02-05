# AI QA 파이프라인 설정 가이드 (API Key 방식)

이 가이드는 `Anthropic API Key`를 사용하여 AI 기반 테스트 생성 및 자동 수정을 실행하는 방법을 설명합니다.

---

## 1. API 키 발급 (Get API Key)

1.  [Anthropic Console](https://console.anthropic.com/)에 접속하여 로그인합니다.
2.  **"Get API Keys"** 메뉴로 이동합니다.
3.  **"Create Key"** 버튼을 클릭하여 새 키를 생성합니다 (이름 예: `ai-afterschool-qa`).
4.  생성된 키(`sk-ant-...`)를 복사하여 안전한 곳에 보관합니다.
    *   *주의: 이 키는 절대 외부에 노출되어서는 안 됩니다.*

---

## 2. 로컬 환경 설정 (Local Setup)

로컬에서 `scripts/qa/generate-tests.ts`를 실행하기 위한 설정입니다.

### 방법 A: `.env.local` 파일 사용 (권장)
프로젝트 루트의 `.env.local` 파일에 키를 추가합니다. (이미 `.gitignore`에 포함되어 있어 안전합니다.)

```bash
# .env.local 파일 열기/생성
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." >> .env.local
```

### 방법 B: 일회성 환경 변수 실행
파일에 저장하지 않고 터미널 세션에서만 임시로 사용합니다.

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
npx tsx scripts/qa/generate-tests.ts
```

---

## 3. GitHub Actions 설정 (CI CD Setup)

GitHub에 코드를 올렸을 때, 자동으로 테스트가 실행되게 하려면 **GitHub Secrets**에 키를 등록해야 합니다.

1.  GitHub 저장소 페이지로 이동합니다.
2.  **Settings** > **Secrets and variables** > **Actions** 메뉴를 클릭합니다.
3.  **"New repository secret"** 버튼을 클릭합니다.
    *   **Name**: `ANTHROPIC_API_KEY`
    *   **Secret**: (복사해둔 `sk-ant-...` 키 붙여넣기)
4.  **"Add secret"**를 눌러 저장합니다.

---

## 4. 실행 및 검증 (Execution)

### 로컬 실행 (Test Generation)
시나리오 문서(`docs/qa/SCENARIOS.md`)를 기반으로 테스트 코드를 생성합니다.

```bash
# 테스트 생성
npx tsx scripts/qa/generate-tests.ts

# 생성된 테스트 실행 (Playwright)
npx playwright test
```

### CI 자동 실행
1.  작업 내용을 커밋하고 푸시합니다.
    ```bash
    git add .
    git commit -m "feat: setup ai qa pipeline"
    git push origin main
    ```
2.  GitHub 저장소의 **"Actions"** 탭으로 이동합니다.
3.  **"AI-Native QA"** 워크플로우가 자동으로 실행되는 것을 확인합니다.
