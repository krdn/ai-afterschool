# Phase 5: AI Image Analysis - Context

**Created:** 2026-01-29
**Phase Goal:** AI 기반으로 관상 및 손금 분석을 제공한다

## Overview

이 단계는 Phase 2에서 구축한 이미지 업로드 인프라를 활용하여, 업로드된 얼굴 및 손바닥 사진을 AI로 분석하고 전통적 관상/손금 해석을 제공합니다.

## Dependencies

- **Phase 2 (File Infrastructure)**: 이미지 업로드 및 Cloudinary 저장소 완료 필수
- **Phase 1 (Foundation)**: 학생 프로필 및 인증 시스템 완료 필수

## Requirements Coverage

| Requirement | Description |
|-------------|-------------|
| **AIAN-01** | 얼굴 사진을 업로드하면 AI가 관상 분석을 제공한다 |
| **AIAN-02** | 손바닥 사진을 업로드하면 AI가 손금 분석을 제공한다 |

## Success Criteria

1. 업로드된 얼굴 사진을 분석하여 AI 관상 해석을 제공한다
2. 업로드된 손바닥 사진을 분석하여 AI 손금 해석을 제공한다
3. 이미지 품질이 낮거나 부적합할 경우 분석을 거부하고 재업로드를 요청한다
4. AI 분석은 "전통 해석 참고용 엔터테인먼트" 면책 조항과 함께 표시된다
5. 분석 결과가 학생 프로필에 저장되고 언제든 조회할 수 있다

## Current Codebase Context

### Image Storage (Phase 2)
- **Cloudinary** 클라우드 저장소 사용
- 이미지 메타데이터는 `StudentImage` 테이블에 저장
- 이미지 타입: `profile` (프로필), `face` (관상용), `palm` (손금용)

### Student Profile Structure
- 학생 상세 페이지(`/students/[id]`)에 분석 패널들이 위치
- 기존 패널: SajuAnalysisPanel, NameAnalysisPanel, MbtiAnalysisPanel
- 추가 필요: FaceAnalysisPanel, PalmAnalysisPanel

## Key Technical Decisions Needed

### 1. AI Vision Service 선택
- **옵션 A**: Claude Vision API (Anthropic)
  - 장점: 정확한 이미지 분석, 한글 해석 용이
  - 단점: API 비용, 속도

- **옵션 B**: OpenAI GPT-4 Vision
  - 장점: 널리 사용됨, 문서화 잘됨
  - 단점: API 비용

- **옵션 C**: Google Cloud Vision + 별도 해석 로직
  - 장점: 얼굴 특징 추출 정확
  - 단점: 전통 관상 해석은 별도 구현 필요

### 2. 이미지 품질 검사 전략
- 흐림 정도(blur) 감지
- 얼굴/손바닥 검출 여부 확인
- 조도/대비 확인
- 재업로드 가이드 제공

### 3. 분석 결과 저장 구조
- 응답 형식: 구조화된 JSON
- 저장 위치: 새 테이블 또는 기존 분석 테이블 확장
- 캐싱 전략: 동일 이미지 재분석 방지

### 4. 비동기 처리 설계
- 이미지 분석은 시간이 소요될 수 있음
- 진행 상태 표시 (분석 중 → 완료)
- 실패 시 재시도 메커니즘

## UI/UX Considerations

### 관상 분석 패널
- 얼굴 사진 프리뷰
- "분석 시작" 버튼
- 분석 진행 중 로딩 상태
- 결과 표시 영역 (면책 조항 포함)

### 손금 분석 패널
- 손바닥 사진 프리뷰
- 양손 선택 (좌/우)
- "분석 시작" 버튼
- 결과 표시 영역 (면책 조항 포함)

## Legal & Ethical Considerations

1. **면책 조항 필수**: "전통 해석 참고용 엔터테인먼트" 명시
2. **과학적 근거 부족**: 관상/손금은 과학적 검증이 부족함을 사용자에게 인지
3. **데이터 프라이버시**: 얼굴/손바닥 이미지는 민감한 생체 데이터
4. **AI 한계 안내**: AI 해석은 참고용이며 실제 상담은 전문가와 상담 권장

## Reference Data

### 전통 관상 항목 (예시)
- 얼굴형 (계란형, 둥근형, 각진형 등)
- 이목구비 특징
- 눈썹, 눈, 코, 입, 귀 형태
- 이마, 턱 형태

### 전통 손금 항목 (예시)
- 생명선 (건강, 생명력)
- 두뇌선 (지적 능력)
- 감정선 (정서적 성향)
- 운명선 (성공, 운)
- 결혼선 (연애, 결혼)

## Open Questions

1. 어떤 AI Vision 서비스를 사용할 것인가?
2. 이미지 품질 검사는 클라이언트에서 할 것인가 서버에서 할 것인가?
3. 분석 실패 시 재시도 횟수 제한은?
4. 분석 결과 이력을 관리할 것인가 (최신 결과만 보관)?
