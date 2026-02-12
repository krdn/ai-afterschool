/**
 * Help Content
 *
 * 도움말 콘텐츠를 정의합니다.
 * 인라인 도움말과 헬프 센터에서 사용됩니다.
 */

export type HelpCategory =
  | 'getting-started'
  | 'providers'
  | 'features'
  | 'troubleshooting';

/**
 * 도움말 주제 인터페이스
 */
export interface HelpTopic {
  id: string;
  category: HelpCategory;
  title: string;
  summary: string;
  content: string | string[];
  relatedTopics?: string[];
  prerequisites?: string[];
}

/**
 * 도움말 콘텐츠 데이터
 */
export const helpContent: Record<string, HelpTopic> = {
  // === Getting Started 카테고리 ===
  'what-is-llm-hub': {
    id: 'what-is-llm-hub',
    category: 'getting-started',
    title: 'LLM Hub란?',
    summary: '다양한 AI 모델을 하나의 시스템에서 통합 관리하는 허브 시스템',
    content: [
      'Universal LLM Hub는 다양한 AI 제공자(OpenAI, Anthropic, Google 등)의 모델을 하나의 시스템에서 통합 관리하고 사용할 수 있는 시스템입니다.',
      '',
      '## 주요 기능',
      '- **다중 제공자 지원**: OpenAI, Anthropic Claude, Google Gemini, Ollama 등 다양한 제공자 등록 가능',
      '- **기능별 매핑**: 용도에 따라 최적의 모델 자동 선택 (예: 이미지 분석 → Vision 지원 모델)',
      '- **폴 백 체인**: 1순위 모델 실패 시 자동으로 다음 모델 사용',
      '- **비용/품질 최적화**: 예산과 품질 요구사항에 맞는 모델 선택',
      '',
      '## 사용 예시',
      '1. 학생 관상 분석 → Vision 지원 모델 (GPT-4o, Claude Sonnet)',
      '2. 상담 보고서 생성 → 고품질 텍스트 모델 (GPT-4o, Claude Opus)',
      '3. 빠른 질문 응답 → 경제적 모델 (GPT-4o Mini, Gemini Flash)',
    ].join('\n'),
    relatedTopics: ['quick-start', 'concepts'],
  },

  'quick-start': {
    id: 'quick-start',
    category: 'getting-started',
    title: '빠른 시작 가이드',
    summary: '첫 제공자 등록부터 사용까지 5분 완성',
    content: [
      '## 1단계: 제공자 선택 (1분)',
      '- `/admin/llm-providers` 페이지로 이동',
      '- "새 제공자 추가" 버튼 클릭',
      '- 템플릿 선택: OpenAI, Anthropic, Google 등',
      '',
      '## 2단계: API 키 입력 (2분)',
      '- 선택한 제공자의 API 키 발급 (도움말 링크 제공)',
      '- API 키를 안전하게 입력',
      '- 연결 테스트 클릭 → "연결 성공" 확인',
      '',
      '## 3단계: 모델 동기화 (1분)',
      '- "모델 동기화" 버튼 클릭',
      '- 사용 가능한 모델 목록 확인',
      '',
      '## 4단계: 기능 매핑 확인 (1분)',
      '- `/admin/llm-features` 페이지로 이동',
      '- 기본 설정된 기능 매핑 확인',
      '- 필요시 사용자화',
      '',
      '완료! 이제 AI 기능을 사용할 수 있습니다.',
    ].join('\n'),
    relatedTopics: ['what-is-llm-hub', 'api-key-guide', 'feature-mapping'],
  },

  concepts: {
    id: 'concepts',
    category: 'getting-started',
    title: '핵심 개념',
    summary: '제공자, 모델, 기능 매핑의 이해',
    content: [
      '## 제공자 (Provider)',
      'AI 모델을 제공하는 서비스입니다. OpenAI, Anthropic, Google 등이 제공자에 해당합니다.',
      '- **등록**: API 키를 입력하여 제공자를 시스템에 등록',
      '- **활성화/비활성화**: 필요에 따라 특정 제공자를 일시적으로 끄기',
      '- **상태**: 연결됨(정상), 연결 실패(키 오류), 미검증(테스트 필요)',
      '',
      '## 모델 (Model)',
      '제공자가 제공하는 구체적인 AI 모델입니다.',
      '- **컨텍스트 윈도우**: 모델이 한 번에 처리할 수 있는 텍스트량',
      '- **Vision 지원**: 이미지 분석 기능 제공 여부',
      '- **Function Calling**: 도구/함수 호출 지원 여부',
      '',
      '## 기능 매핑 (Feature Mapping)',
      '특정 기능(예: 이미지 분석)을 수행할 때 어떤 모델을 사용할지 정의합니다.',
      '- **태그 기반**: 조건에 맞는 모델 자동 선택 (예: vision 태그 있는 모델)',
      '- **직접 지정**: 특정 모델을 명시적으로 선택',
      '- **폴 백**: 1순위 모델 실패 시 다음 모델로 자동 전환',
    ].join('\n'),
    relatedTopics: ['what-is-llm-hub', 'feature-mapping'],
  },

  // === Providers 카테고리 ===
  'provider-openai': {
    id: 'provider-openai',
    category: 'providers',
    title: 'OpenAI 등록 방법',
    summary: 'GPT-4o, GPT-4o Mini 등 OpenAI 모델 사용하기',
    content: [
      '## API 키 발급',
      '1. [OpenAI Platform](https://platform.openai.com)에 로그인',
      '2. 좌측 메뉴 → "API keys" 클릭',
      '3. "Create new secret key" 버튼 클릭',
      '4. 키 이름 입력 (예: "AI Afterschool")',
      '5. 생성된 키를 **즉시 복사** (다시 볼 수 없음)',
      '',
      '## 등록 단계',
      '1. `/admin/llm-providers` → "새 제공자 추가"',
      '2. "OpenAI GPT" 템플릿 선택',
      '3. 발급받은 API 키 입력',
      '4. "연결 테스트" 클릭',
      '5. "모델 동기화" 클릭',
      '',
      '## 주의사항',
      '- API 키는 **절대 외부에 노출하지 마세요**',
      '- 사용량에 따라 요금이 부과됩니다',
      '- [사용량 대시보드](https://platform.openai.com/usage)에서 실시간 확인 가능',
    ].join('\n'),
    relatedTopics: ['api-key-guide', 'security'],
  },

  'provider-anthropic': {
    id: 'provider-anthropic',
    category: 'providers',
    title: 'Anthropic Claude 등록 방법',
    summary: 'Claude Sonnet, Claude Opus 등 Anthropic 모델 사용하기',
    content: [
      '## API 키 발급',
      '1. [Anthropic Console](https://console.anthropic.com)에 로그인',
      '2. 상단 메뉴 → "API Keys" 클릭',
      '3. "Create Key" 버튼 클릭',
      '4. 키 이름 입력 (예: "AI Afterschool")',
      '5. 생성된 키를 **즉시 복사**',
      '',
      '## Claude 모델 선택 가이드',
      '- **Claude Opus**: 최고 품질, 복잡한 분석에 적합 (비용 높음)',
      '- **Claude Sonnet**: 균형잡힌 성능과 비용 (추천)',
      '- **Claude Haiku**: 빠른 응답, 간단한 작업에 적합 (비용 낮음)',
      '',
      '## 등록 후 확인',
      '모델 동기화 시 다음 모델이 자동 등록됩니다:',
      '- claude-sonnet-4-5',
      '- claude-3-5-haiku-latest',
      '- claude-opus-4',
    ].join('\n'),
    relatedTopics: ['api-key-guide', 'security'],
  },

  'provider-google': {
    id: 'provider-google',
    category: 'providers',
    title: 'Google Gemini 등록 방법',
    summary: 'Gemini 2.5 Flash, Gemini 2.0 Pro 등 Google 모델 사용하기',
    content: [
      '## API 키 발급',
      '1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속',
      '2. Google 계정으로 로그인',
      '3. "Create API Key" 버튼 클릭',
      '4. 프로젝트 선택 (또는 새 프로젝트 생성)',
      '5. 생성된 키 복사',
      '',
      '## Gemini 특징',
      '- **대용량 컨텍스트**: 100만 토큰 이상 처리 가능',
      '- **한국어 성능**: 한국어 처리에 강점',
      '- **비용 효율**: OpenAI 대비 저렴한 가격',
      '',
      '## 묶음 사용 가능',
      'Google AI Studio는 월 일정량을 묶음으로 제공합니다.',
      '- Gemini 2.0 Flash Lite: 월 1,500 요청 묶음',
      '- 테스트 및 개발에 적합',
    ].join('\n'),
    relatedTopics: ['api-key-guide', 'security'],
  },

  'provider-ollama': {
    id: 'provider-ollama',
    category: 'providers',
    title: 'Ollama(로컬 LLM) 등록 방법',
    summary: '로컬 환경에서 묶음으로 AI 모델 실행하기',
    content: [
      '## Ollama란?',
      'Ollama는 로컬 컴퓨터에서 오픈소스 LLM(Llama, Mistral 등)을 실행하는 도구입니다.',
      '- **데이터 프라이버시**: 외부 서버로 데이터가 전송되지 않음',
      '- **묶음 사용**: API 호출 비용 없음',
      '- **오프라인 사용**: 인터넷 없이도 AI 기능 사용 가능',
      '',
      '## 설치 방법',
      '1. [ollama.com](https://ollama.com)에서 다운로드',
      '2. 설치 후 터미널에서 다음 명령 실행:',
      '   ```bash',
      '   ollama serve',
      '   ```',
      '',
      '## 모델 다운로드',
      '```bash',
      '# Llama 3.2 (경량, 빠름)',
      'ollama pull llama3.2:3b',
      '',
      '# Mistral (균형잡힌 성능)',
      'ollama pull mistral:7b',
      '',
      '# Phi-4 (Microsoft, 한국어 지원)',
      'ollama pull phi4',
      '```',
      '',
      '## 등록 방법',
      '1. `/admin/llm-providers` → "새 제공자 추가"',
      '2. "Ollama" 템플릿 선택',
      '3. Base URL 확인 (기본값: http://localhost:11434/api)',
      '4. API 키는 비워두어도 됩니다 (로컬 사용)',
      '',
      '## 주의사항',
      '- Ollama 서버가 실행 중이어야 연결됩니다',
      '- 충분한 RAM 필요 (7B 모델은 약 4-6GB)',
    ].join('\n'),
    relatedTopics: ['concepts', 'security'],
  },

  'provider-custom': {
    id: 'provider-custom',
    category: 'providers',
    title: '직접 설정으로 등록하기',
    summary: 'OpenAI 호환 API를 사용하는 커스텀 제공자 등록',
    content: [
      '## OpenAI 호환 API란?',
      'OpenAI의 API 형식을 따르는 서드파티 서비스입니다.',
      '- **Azure OpenAI**: Microsoft Azure에서 제공하는 OpenAI 서비스',
      '- **Together AI**: 오픈소스 모델 호스팅',
      '- **Fireworks AI**: 고성능 모델 추론 서비스',
      '- **로컬 서버**: LM Studio, LocalAI 등',
      '',
      '## 등록 방법',
      '1. `/admin/llm-providers` → "새 제공자 추가"',
      '2. 맨 아래 "직접 설정 (OpenAI 호환)" 선택',
      '3. 다음 정보 입력:',
      '   - **이름**: 표시될 이름 (예: "Azure OpenAI")',
      '   - **Base URL**: API 엔드포인트',
      '   - **인증 방식**: API 키 또는 사용자 지정 헤더',
      '',
      '## Azure OpenAI 예시',
      '- Base URL: `https://your-resource.openai.azure.com/openai/deployments/your-deployment`',
      '- Auth Type: `api_key`',
      '- API Key: Azure Portal에서 발급',
    ].join('\n'),
    relatedTopics: ['provider-openai'],
  },

  'api-key-guide': {
    id: 'api-key-guide',
    category: 'providers',
    title: 'API 키는 어디서 얻나요?',
    summary: '주요 AI 제공자별 API 키 발급처 정리',
    content: [
      '## 주요 제공자별 발급처',
      '',
      '| 제공자 | 발급 URL | 비고 |',
      '|--------|----------|------|',
      '| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | 유료, 사용량 기반 과금 |',
      '| Anthropic | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | 유료, 사용량 기반 과금 |',
      '| Google | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | 묶음 + 유료 |',
      '| DeepSeek | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | 저렴한 가격 |',
      '| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys/) | 유료 |',
      '',
      '## API 키 보안 체크리스트',
      '- [ ] 키를 이메일이나 메신저로 공유하지 않기',
      '- [ ] 키가 코드에 하드코딩되어 있지 않은지 확인',
      '- [ ] 정기 사용량을 모니터링하여 이상 징후 감지',
      '- [ ] 불필요한 키는 삭제하기',
    ].join('\n'),
    relatedTopics: ['security', 'provider-openai', 'provider-anthropic'],
  },

  security: {
    id: 'security',
    category: 'providers',
    title: 'API 키 보안',
    summary: 'API 키를 안전하게 관리하는 방법',
    content: [
      '## 저장 방식',
      'API 키는 데이터베이스에 **암호화되어 저장**됩니다.',
      '- AES-256 암호화 알고리즘 사용',
      '- 데이터베이스 직접 접근필도 키를 볼 수 없음',
      '',
      '## 전송 보안',
      '- 모든 통신은 HTTPS를 통해 암호화',
      '- API 키는 요청 헤더의 Authorization 필드에 포함',
      '',
      '## 접근 제어',
      '- 제공자 관리는 **DIRECTOR** 권한만 가능',
      '- API 키는 관리자 화면에서도 마스킹되어 표시',
      '',
      '## 모범 사례',
      '1. **별도 키 사용**: 각 시스템마다 다른 API 키 발급',
      '2. **정기 교체**: 3-6개월마다 키 교체',
      '3. **사용량 모니터링**: 이상한 사용 패턴 감지',
      '4. **최소 권한**: 필요한 기능만 허용된 키 사용',
    ].join('\n'),
    relatedTopics: ['api-key-guide'],
  },

  // === Features 카테고리 ===
  'feature-mapping': {
    id: 'feature-mapping',
    category: 'features',
    title: '기능별 LLM 매핑이란?',
    summary: '용도에 따라 최적의 AI 모델 자동 선택 시스템',
    content: [
      '## 개념',
      '기능별 LLM 매핑은 "어떤 작업을 할 때 어떤 AI 모델을 사용할까?"를 자동으로 결정하는 시스템입니다.',
      '',
      '## 예시',
      '- **학생 관상 분석** → Vision 지원 모델 필요 → GPT-4o 또는 Claude Sonnet',
      '- **상담 보고서** → 고품질 텍스트 생성 → GPT-4o 또는 Claude Opus',
      '- **빠른 응답** → 경제적 모델 → GPT-4o Mini',
      '',
      '## 매칭 방식',
      '1. **태그 기반 자동 매칭**: 조건에 맞는 모델을 자동으로 검색',
      '2. **직접 모델 지정**: 특정 모델을 명시적으로 선택',
      '',
      '## 폴 백(대체) 전략',
      '1순위 모델을 사용할 수 없을 때(과부하, 오류 등) 다음 순위 모델로 자동 전환합니다.',
    ].join('\n'),
    relatedTopics: ['concepts', 'auto-tag-match', 'specific-model'],
  },

  'auto-tag-match': {
    id: 'auto-tag-match',
    category: 'features',
    title: '태그 기반 자동 매칭 사용법',
    summary: '조건으로 모델을 자동 선택하는 방법',
    content: [
      '## 태그 기반 매칭이란?',
      '원하는 모델의 특성을 태그로 지정하면, 조건에 맞는 모델을 자동으로 찾아줍니다.',
      '',
      '## 설정 방법',
      '1. `/admin/llm-features` 페이지로 이동',
      '2. 원하는 기능 선택 (예: "학생 이미지 분석")',
      '3. "태그 기반 자동 매칭" 선택',
      '4. 필터 조건 설정:',
      '',
      '## 필터 옵션',
      '- **필수 태그**: 반드시 가지고 있어야 하는 기능',
      '  - `vision`: 이미지 분석 기능',
      '  - `function_calling`: 함수 호출 기능',
      '',
      '- **제외 태그**: 제외할 기능',
      '  - `deprecated`: 더 이상 사용되지 않는 모델 제외',
      '',
      '- **최소 컨텍스트**: 처리할 수 있는 최소 텍스트량',
      '  - 예: 8000 토큰 이상',
      '',
      '- **비용/품질 등급**: 원하는 등급 범위',
      '  - 예: medium ~ high (중간에서 고급)',
    ].join('\n'),
    relatedTopics: ['feature-mapping', 'fallback'],
  },

  'specific-model': {
    id: 'specific-model',
    category: 'features',
    title: '직접 모델 지정 사용법',
    summary: '특정 모델을 명시적으로 선택하는 방법',
    content: [
      '## 직접 지정이 필요한 경우',
      '- **일관된 응답**: 항상 같은 모델이 처리하도록 보장',
      '- **특정 모델 의존**: 특정 모델의 고유 기능 사용',
      '- **비용 제어**: 특정 모델만 사용하도록 제한',
      '',
      '## 설정 방법',
      '1. `/admin/llm-features` 페이지로 이동',
      '2. 원하는 기능 선택',
      '3. "직접 모델 지정" 선택',
      '4. 제공자 선택 → 모델 선택',
      '',
      '## 장점',
      '- 예측 가능한 동작',
      '- 특정 모델의 고유 기능 활용',
      '',
      '## 단점',
      '- 선택한 모델에 장애가 생기면 기능이 중단될 수 있음',
      '- 폴 백 설정이 필수적',
    ].join('\n'),
    relatedTopics: ['feature-mapping', 'fallback'],
  },

  fallback: {
    id: 'fallback',
    category: 'features',
    title: '폴 백(대체) 전략 설정',
    summary: '1순위 모델 실패 시 대체 모델 선택 방식',
    content: [
      '## 폴 백이란?',
      '1순위 모델을 사용할 수 없을 때(과부하, 오류, 한도 초과) 다음 모델로 자동 전환하는 기능입니다.',
      '',
      '## 폴 백 모드',
      '',
      '### 1. 다음 우선순위 (next_priority)',
      '우선순위가 다음인 모델로 전환합니다.',
      '- 예: 1순위(GPT-4o) 실패 → 2순위(Claude Sonnet) → 3순위(Gemini Pro)',
      '- **권장**: 대부분의 경우 이 모드를 사용하세요',
      '',
      '### 2. 사용 가능한 아무 모델 (any_available)',
      '조건에 맞는 사용 가능한 모델 중 아무거나 선택합니다.',
      '- 예: Vision 지원 모델 중 아무거나',
      '- 사용 시나리오: 가용성이 최우선인 경우',
      '',
      '### 3. 실패 (fail)',
      '폴 백을 사용하지 않고 즉시 실패로 처리합니다.',
      '- 사용 시나리오: 특정 모델만 사용해야 하는 경우',
      '',
      '## 폴 백 체인 보기',
      '`/admin/llm-features`에서 각 규칙의 "미리보기"를 클릭하면 폴 백 체인을 확인할 수 있습니다.',
    ].join('\n'),
    relatedTopics: ['feature-mapping', 'auto-tag-match'],
  },

  'vision-features': {
    id: 'vision-features',
    category: 'features',
    title: '이미지 분석 기능 설정',
    summary: '학생 사진/관상 분석에 필요한 Vision 기능',
    content: [
      '## Vision 기능이란?',
      'AI 모델이 이미지를 이해하고 분석할 수 있는 기능입니다.',
      '- 학생 사진 분석',
      '- 관상 분석',
      '- 손금 분석',
      '- 문서 이미지 인식',
      '',
      '## Vision 지원 모델',
      '',
      '| 제공자 | 모델 |',
      '|--------|------|',
      '| OpenAI | GPT-4o, GPT-4o Mini |',
      '| Anthropic | Claude Sonnet, Claude Opus |',
      '| Google | Gemini 2.5 Flash, Gemini 2.0 Pro |',
      '| xAI | Grok 3 |',
      '',
      '## 설정 방법',
      '1. `/admin/llm-features` → "학생 이미지 분석"',
      '2. "태그 기반 자동 매칭" 선택',
      '3. 필수 태그에 `vision` 추가',
      '4. "결과 미리보기"로 확인',
      '',
      '## 비용 팁',
      'Vision 기능은 이미지 크기에 따라 토큰 사용량이 달라집니다.',
      '- 작은 이미지(512x512) → 약 255 토큰',
      '- 큰 이미지(1024x1024) → 약 765 토큰',
    ].join('\n'),
    relatedTopics: ['auto-tag-match'],
  },

  // === Troubleshooting 카테고리 ===
  'connection-failed': {
    id: 'connection-failed',
    category: 'troubleshooting',
    title: '연결 테스트 실패 시',
    summary: '제공자 연결 실패 원인과 해결 방법',
    content: [
      '## 일반적인 원인',
      '',
      '### 1. API 키 오류',
      '- **증상**: "Invalid API key" 또는 "Authentication failed"',
      '- **해결**: API 키를 다시 확인하고 복사 (공백 주의)',
      '',
      '### 2. 네트워크 문제',
      '- **증상**: "Network error" 또는 "Timeout"',
      '- **해결**: 방화벽 설정 확인, API 엔드포인트 접근 가능 여부 확인',
      '  ```bash',
      '  curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_API_KEY"',
      '  ```',
      '',
      '### 3. Base URL 오류',
      '- **증상**: "Not found" 또는 "Invalid endpoint"',
      '- **해결**: Base URL이 정확한지 확인 (끝에 `/v1` 포함 여부)',
      '',
      '### 4. 과금 문제',
      '- **증상**: "Insufficient quota" 또는 "Billing required"',
      '- **해결**: 제공자 대시보드에서 결제 정보 확인',
    ].join('\n'),
    relatedTopics: ['provider-openai', 'provider-anthropic'],
  },

  'rate-limit': {
    id: 'rate-limit',
    category: 'troubleshooting',
    title: 'API 호출 한도 초과',
    summary: 'Rate limit 오류 해결과 예방',
    content: [
      '## Rate Limit이란?',
      '제공자가 설정한 분/시간당 최대 API 호출 횟수입니다.',
      '- OpenAI: 분당 요청 수 및 토큰 수 제한',
      '- Anthropic: 분당 요청 수 제한',
      '',
      '## 해결 방법',
      '',
      '### 즉시 조치',
      '1. **폴 백 활용**: 기능 매핑에서 폴 백 모델 설정',
      '2. **제공자 추가**: 다른 제공자 등록 및 매핑에 추가',
      '',
      '### 장기 조치',
      '1. **Rate Limit 증가 요청**: 제공자에 Tier 업그레이드 요청',
      '2. **캐싱 도입**: 동일한 요청 결과 캐싱',
      '3. **요청 큐잉**: 비동기 처리로 순차 실행',
      '',
      '## 모니터링',
      '`/admin/llm-features`에서 각 기능의 사용량을 모니터링하세요.',
    ].join('\n'),
    relatedTopics: ['fallback', 'cost-optimization'],
  },

  'no-model-found': {
    id: 'no-model-found',
    category: 'troubleshooting',
    title: '적절한 모델을 찾을 수 없을 때',
    summary: '모델 해상 실패 원인과 해결',
    content: [
      '## 원인 분석',
      '',
      '### 1. 제공자 미등록',
      '- **증상**: "No matching model found"',
      '- **확인**: `/admin/llm-providers`에서 제공자 등록 여부 확인',
      '',
      '### 2. 모델 비활성화',
      '- **증상**: 등록된 제공자지만 모델이 활성화되지 않음',
      '- **확인**: 제공자의 "모델 동기화" 클릭',
      '',
      '### 3. 태그 조건 불일치',
      '- **증상**: 필터 조건이 너무 엄격함',
      '- **해결**: 필수 태그 줄이거나 제외 태그 제거',
      '',
      '### 4. 제공자 연결 실패',
      '- **증상**: 제공자 상태가 "연결 실패"',
      '- **해결**: API 키 확인 후 연결 테스트',
    ].join('\n'),
    relatedTopics: ['connection-failed', 'feature-mapping'],
  },

  'cost-optimization': {
    id: 'cost-optimization',
    category: 'troubleshooting',
    title: '비용 절약 팁',
    summary: 'LLM 사용 비용을 줄이는 방법',
    content: [
      '## 비용 절약 전략',
      '',
      '### 1. 적절한 모델 선택',
      '| 작업 유형 | 추천 모델 |',
      '|-----------|-----------|',
      '| 간단한 질문/응답 | GPT-4o Mini, Claude Haiku |',
      '| 일반 분석 | Gemini Flash, DeepSeek Chat |',
      '| 복잡한 분석 | GPT-4o, Claude Sonnet |',
      '| 최고 품질 필요 | Claude Opus (선택적) |',
      '',
      '### 2. 기능별 매핑 최적화',
      '- 중요도에 따라 품질 등급 조정',
      '- Vision 필요한 경우에만 Vision 모델 사용',
      '',
      '### 3. 캐싱 활용',
      '- 동일한 입력에 대한 결과 캐싱',
      '- 이미지 분석 결과 저장 및 재사용',
      '',
      '### 4. 제공자 혼합 사용',
      '- 저렴한 제공자(DeepSeek, Google)를 기본으로',
      '- 고품질 필요 시에만 프리미엄 제공자 사용',
    ].join('\n'),
    relatedTopics: ['feature-mapping', 'rate-limit'],
  },
};

/**
 * 모든 도움말 주제를 배열로 반환합니다.
 */
export function getAllHelpTopics(): HelpTopic[] {
  return Object.values(helpContent);
}

/**
 * 특정 ID의 도움말 주제를 반환합니다.
 */
export function getHelpTopic(id: string): HelpTopic | undefined {
  return helpContent[id];
}

/**
 * 카테고리별 도움말 주제를 반환합니다.
 */
export function getHelpByCategory(category: HelpCategory): HelpTopic[] {
  return Object.values(helpContent).filter((topic) => topic.category === category);
}

/**
 * 카테고리 목록을 반환합니다.
 */
export function getHelpCategories(): { id: HelpCategory; name: string }[] {
  return [
    { id: 'getting-started', name: '시작하기' },
    { id: 'providers', name: '제공자' },
    { id: 'features', name: '기능' },
    { id: 'troubleshooting', name: '문제해결' },
  ];
}

/**
 * 도움말 내용을 검색합니다.
 */
export function searchHelp(query: string): HelpTopic[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(helpContent).filter(
    (topic) =>
      topic.title.toLowerCase().includes(lowercaseQuery) ||
      topic.summary.toLowerCase().includes(lowercaseQuery) ||
      (typeof topic.content === 'string'
        ? topic.content.toLowerCase().includes(lowercaseQuery)
        : topic.content.some((line) => line.toLowerCase().includes(lowercaseQuery)))
  );
}

/**
 * 관련 주제를 반환합니다.
 */
export function getRelatedTopics(id: string): HelpTopic[] {
  const topic = helpContent[id];
  if (!topic?.relatedTopics) return [];

  return topic.relatedTopics
    .map((relatedId) => helpContent[relatedId])
    .filter(Boolean);
}
