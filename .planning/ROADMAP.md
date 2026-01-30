# Roadmap: AI AfterSchool

## Overview

AI AfterSchool을 학생 정보 관리 기반 위에 전통 분석(사주, 성명학), 심리 분석(MBTI), AI 이미지 분석(관상, 손금)을 단계적으로 쌓아 올려 맞춤형 학습 전략 및 진로 가이드를 제공하는 차별화된 입시 컨설팅 시스템으로 구축합니다. 핵심은 저위험 계산 기반 분석을 먼저 검증하고, 고위험 AI 기능은 핵심 가치 확인 후 추가하는 것입니다.

v1.1 Production Readiness는 개발 환경을 프로덕션 배포용으로 변환하여 단일 조직(50~200명 학생)용 홈 서버에서 안정적으로 운영할 수 있도록 합니다. Docker 기반 배포 인프라, 데이터베이스 및 렌더링 성능 최적화, 기술 부채 해결(PDF 저장소 S3 호환 스토리지 마이그레이션, 코드 중복 제거), 프로덕션 모니터링을 포함합니다.

## Milestones

- ✅ **v1.1 Production Readiness** — Phases 8-10 (shipped 2026-01-30) — [Full details in milestones/v1.1-ROADMAP.md](.planning/milestones/v1.1-ROADMAP.md)
- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-01-30) — [Full details in milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)
- 📋 **v2.0** — Academy management and user expansion (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### 📋 v2.0 (Planned)

**Milestone Goal:** 프로덕션 준비 이후의 향후 기능 강화

[Requirements and phases to be defined after v1.1 completion]

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 7/7 | Complete | 2026-01-28 |
| 2. File Infrastructure | v1.0 | 4/4 | Complete | 2026-01-28 |
| 3. Calculation Analysis | v1.0 | 4/4 | Complete | 2026-01-28 |
| 4. MBTI Analysis | v1.0 | 4/4 | Complete | 2026-01-29 |
| 5. AI Image Analysis | v1.0 | 5/5 | Complete | 2026-01-29 |
| 6. AI Integration | v1.0 | 5/5 | Complete | 2026-01-29 |
| 7. Reports | v1.0 | 7/7 | Complete | 2026-01-29 |
| 8. Production Infrastructure Foundation | v1.1 | 10/10 | Complete | 2026-01-30 |
| 9. Performance & Database Optimization | v1.1 | 5/5 | Complete | 2026-01-30 |
| 10. Technical Debt Resolution & Monitoring | v1.1 | 7/7 | Complete | 2026-01-30 |

**Overall Progress:** 58/58 plans complete (100%)
