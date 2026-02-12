---
phase: 35-universal-llm-hub
plan: 08
subsystem: llm-hub
tags: [help-system, inline-help, recommender, wizard]
dependencies:
  requires: [35-06, 35-07]
  provides: help-system
tech-stack:
  added: []
  patterns: [help-content-management, wizard-pattern, inline-help]
key-files:
  created:
    - src/lib/help/help-content.ts
    - src/components/help/llm-recommender.tsx
    - src/app/admin/llm-providers/help-integration.tsx
    - src/app/admin/llm-features/help-integration.tsx
  modified:
    - src/components/admin/llm-providers/provider-form.tsx
    - src/app/admin/llm-providers/page.tsx
    - src/app/admin/llm-features/page.tsx
decisions: []
metrics:
  duration: 25min
  completed: 2026-02-12
---

# Phase 35 Plan 08: Help System Summary

## Overview

Universal LLM Hub의 종합 도움말 시스템 구현 완료. 인라인 도움말 + 헬프 센터 + 스마트 추천 시스템 제공.

## What Was Built

### 1. 도움말 콘텐츠 정의 (src/lib/help/help-content.ts)

- **HelpTopic 인터페이스**: id, category, title, summary, content, relatedTopics, prerequisites
- **4개 카테고리**: 시작하기, 제공자, 기능, 문제해결
- **20+ 도움말 주제**: LLM Hub 소개부터 문제 해결까지 포괄적 커버리지
- **Helper 함수**: getHelpTopic, getHelpByCategory, searchHelp, getRelatedTopics

### 2. 인라인 도움말 컴포넌트 (src/components/help/)

- **InlineHelp**: (?) 아이콘으로 필드별 도움말 제공
  - Hover 시 요약 미리보기
  - Click 시 상세 내용 Dialog
  - Placement 지원 (top/right/bottom/left)
- **HelpButton**: FAB (Floating Action Button)로 전역 도움말 접근

### 3. 헬프 센터 (src/components/help/help-center.tsx)

- **검색 기능**: 제목/내용 실시간 검색
- **카테고리 탭**: 시작하기 / 제공자 / 기능 / 문제해결
- **주제 카드**: 요약, 카테고리 배지, 선행 주제 표시
- **상세 내용**: 마크다운 렌더링, 관련 주제 링크
- **variant 지원**: page, drawer, dialog

### 4. LLM 추천 위자드 (src/components/help/llm-recommender.tsx)

**단계별 흐름:**
1. **사용 목적**: 학생 분석 / 이미지 분석 / 빠른 분석 / 고품질 / 비용 절감 / 로컬 사용
2. **기술 수준**: 쉬운 방법 / 직접 설정 (privacy 선택 시 스킵)
3. **예산**: 묶음 / 10만원 / 50만원 / 제한 없음
4. **결과**: 1순위, 2순위 추천 + 추천 이유 + 바로 등록

**스마트 스코어링:**
- 목적 기반 태그 매칭 (vision, premium, balanced, low 등)
- 예산 기반 필터링
- 특별 보정 (Google 한국어, Ollama 프라이버시 등)

### 5. 통합 (admin 페이지)

**LLM 제공자 페이지:**
- HelpButton FAB
- HelpCenter Drawer
- LLMRecommender Dialog
- Quick Help Section (처음 설정, API 키 발급)
- ProviderForm InlineHelp (name, baseUrl, apiKey, capabilities)

**LLM 기능 매핑 페이지:**
- HelpButton FAB
- HelpCenter Drawer
- Quick Help Section (기능 매핑, 태그 기반 매칭)

## Commits

1. `914f0be`: 도움말 콘텐츠 시스템 정의 (20+ 주제)
2. `d032e9d`: 인라인 도움말 컴포넌트 (기존 구현 인정)
3. `a5027f1`: LLM 추천 위자드 구현
4. `0f993a8`: 관리자 페이지 도움말 시스템 통합

## Key Features

### 인라인 도움말 UX
- 모든 핵심 입력 필드에 (?) 아이콘
- Hover 시 빠른 요약
- Click 시 상세 Dialog
- 관련 주제 연결

### 헬프 센터 UX
- 검색바 상단 고정
- 실시간 결과 하이라이트
- 카테고리 탭 빠른 이동
- LLM 추천 CTA 버튼

### 추천 위자드 UX
- 진행률 표시 (Progress bar)
- 단계별 뒤로 가기
- 애니메이션 전환
- 추천 결과 상세 정보

## Files Changed

| 파일 | 변경 | 설명 |
|------|------|------|
| src/lib/help/help-content.ts | 생성 | 20+ 도움말 주제 |
| src/components/help/llm-recommender.tsx | 생성 | 추천 위자드 |
| src/app/admin/llm-providers/help-integration.tsx | 생성 | 도움말 통합 |
| src/app/admin/llm-features/help-integration.tsx | 생성 | 도움말 통합 |
| src/components/admin/llm-providers/provider-form.tsx | 수정 | InlineHelp 추가 |
| src/app/admin/llm-providers/page.tsx | 수정 | HelpIntegration |
| src/app/admin/llm-features/page.tsx | 수정 | HelpIntegration |

## Next Steps

Plan 35-09: Testing & Validation
- ProviderRegistry 단위 테스트
- FeatureResolver 단위 테스트
- Universal Router 단위 테스트
- E2E 테스트
