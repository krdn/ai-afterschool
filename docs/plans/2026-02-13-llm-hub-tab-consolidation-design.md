# LLM Hub 탭 통합 디자인

## 목적

관리자 대시보드의 LLM 관련 탭 3개(LLM 설정, 토큰 사용량, Universal LLM Hub)를
하나의 "LLM Hub" 탭으로 통합하여 인지 부하를 줄이고 탐색 효율을 높인다.

## 변경 요약

### 메인 탭: 9개 → 7개

```
변경 전: [LLM 설정] [토큰 사용량] [Universal LLM Hub] [AI 프롬프트] [시스템 상태] [시스템 로그] [DB] [감사 로그] [팀]
변경 후: [LLM Hub] [AI 프롬프트] [시스템 상태] [시스템 로그] [DB] [감사 로그] [팀 관리]
```

- `grid-cols-9` → `grid-cols-7`
- `defaultValue` → `'llm-hub'`
- 삭제 탭: `llm-settings`, `llm-usage`

### LLM Hub 서브탭 3개

| 서브탭 | 콘텐츠 | 출처 |
|--------|--------|------|
| 제공자 관리 | ProviderList + "새 제공자 추가" 버튼 | 기존 universal-llm-tab |
| 기능 매핑 | FeatureMappingList | 기존 universal-llm-tab |
| 사용량 | CostSummaryCards + UsageCharts + CostAlerts | 기존 llm-usage 탭 |

### 변경 파일

| 파일 | 변경 |
|------|------|
| `admin-tabs-wrapper.tsx` | 탭 7개로 축소, 기본값 `llm-hub` |
| `(dashboard)/admin/page.tsx` | `llm-settings`, `llm-usage` TabsContent 제거, `llm-hub`에 사용량 데이터 전달 |
| `universal-llm-tab.tsx` → `llm-hub-tab.tsx` | 서브탭 3개, "Phase 35" 텍스트 제거, 헤더 간소화 |

### 유지하는 것

- `(dashboard)/admin/llm-settings/` 폴더 (import 참조 유지)
- `/admin/llm-providers/`, `/admin/llm-features/` 별도 페이지
- 토큰 사용량 관련 컴포넌트 파일들

## 결정 사항

- 기존 LLM 설정 탭: 완전 제거 (레거시 유지 없음)
- 토큰 사용량: LLM Hub 서브탭으로 흡수
- 접근 방식: 서브탭 패턴 (기존 패턴 확장)
