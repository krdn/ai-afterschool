# Roadmap: AI AfterSchool

## Overview

AI AfterSchool을 학생 정보 관리 기반 위에 전통 분석(사주, 성명학), 심리 분석(MBTI), AI 이미지 분석(관상, 손금)을 단계적으로 쌓아 올려 맞춤형 학습 전략 및 진로 가이드를 제공하는 차별화된 입시 컨설팅 시스템으로 구축합니다. 핵심은 저위험 계산 기반 분석을 먼저 검증하고, 고위험 AI 기능은 핵심 가치 확인 후 추가하는 것입니다.

v1.1 Production Readiness는 개발 환경을 프로덕션 배포용으로 변환하여 단일 조직(50~200명 학생)용 홈 서버에서 안정적으로 운영할 수 있도록 합니다. Docker 기반 배포 인프라, 데이터베이스 및 렌더링 성능 최적화, 기술 부채 해결(PDF 저장소 S3 호환 스토리지 마이그레이션, 코드 중복 제거), 프로덕션 모니터링을 포함합니다.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-01-30) — [Full details in milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Production Readiness** — Phases 8-10 (in progress)
- 📋 **v2.0** — Academy management and user expansion (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 MVP (Phases 1-7) — SHIPPED 2026-01-30</summary>

- [x] Phase 1: Foundation & Authentication (7/7 plans) — completed 2026-01-28
- [x] Phase 2: File Infrastructure (4/4 plans) — completed 2026-01-28
- [x] Phase 3: Calculation Analysis (4/4 plans) — completed 2026-01-28
- [x] Phase 4: MBTI Analysis (4/4 plans) — completed 2026-01-29
- [x] Phase 5: AI Image Analysis (5/5 plans) — completed 2026-01-29
- [x] Phase 6: AI Integration (5/5 plans) — completed 2026-01-29
- [x] Phase 7: Reports (7/7 plans) — completed 2026-01-29

</details>

### 🚧 v1.1 Production Readiness (In Progress)

**Milestone Goal:** 프로덕션 배포 인프라 구축, 성능 최적화, 기술 부채 해결을 통한 안정적인 홈 서버 운영

#### Phase 8: Production Infrastructure Foundation
**Goal**: Docker 기반 배포 인프라 구축 (SSL, S3 호환 PDF 저장소, 헬스 모니터링)
**Depends on**: v1.0 MVP (Phase 7)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-07, DEPLOY-08, STORAGE-01, STORAGE-02, STORAGE-03, STORAGE-04
**Success Criteria** (what must be TRUE):
  1. 단일 `docker compose up -d` 명령으로 프로덕션 서버에 배포 가능
  2. HTTPS가 자동 구성되어 프로덕션 도메인용 유효한 SSL 인증서 발급
  3. `/api/health` 엔드포인트가 healthy 상태를 반환하고 Docker 헬스체크에 응답
  4. PDF 파일이 MinIO S3 호환 스토리지에 영구 볼륨으로 저장
  5. 기존 로컬 PDF 파일이 MinIO로 데이터 손실 없이 이관
  6. PDF 다운로드가 보안 presigned URL을 통해 작동
  7. 환경변수가 적절히 격리됨 (Docker 이미지에 포함되지 않음)
  8. 무중단 배포가 작동하며 배포 실패 시 자동 롤백 활성화
**Plans**: TBD

Plans:
- [ ] 08-01: Docker Compose 프로덕션 구성 (멀티스테이지 빌드, 헬스체크)
- [ ] 08-02: Caddy 리버스 프록시와 자동 SSL
- [ ] 08-03: MinIO S3 호환 스토리지 설정
- [ ] 08-04: PDF 저장소 추상화 레이어
- [ ] 08-05: PDF 데이터 마이그레이션 스크립트
- [ ] 08-06: 헬스체크 엔드포인트
- [ ] 08-07: 환경변수 관리 및 .dockerignore
- [ ] 08-08: 무중단 배포 및 롤백 전략

#### Phase 9: Performance & Database Optimization
**Goal**: 데이터베이스 쿼리 최적화, 연결 풀링, 이미지 최적화로 프로덕션 규모 지원
**Depends on**: Phase 8
**Requirements**: DEPLOY-06, PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. 배포 시 데이터베이스 마이그레이션이 수동 개입 없이 자동 적용
  2. 데이터베이스 연결 풀 고갈 없이 동시 요청 처리
  3. 학생 목록 및 보고서 페이지가 N+1 쿼리 성능 저하 없이 로드
  4. 데이터베이스 인덱스가 자주 조회하는 필드의 쿼리 실행 시간 단축
  5. 학생 사진이 최적화되어 최신 포맷(WebP/AVIF)으로 제공
**Plans**: TBD

Plans:
- [ ] 09-01: 데이터베이스 마이그레이션 자동화 (prisma migrate deploy)
- [ ] 09-02: Prisma 연결 풀링 설정
- [ ] 09-03: 쿼리 최적화 (include를 통한 N+1 방지)
- [ ] 09-04: 일반적인 쿼리를 위한 데이터베이스 인덱스 생성
- [ ] 09-05: Next.js Image 컴포넌트 최적화

#### Phase 10: Technical Debt Resolution & Monitoring
**Goal**: 코드 중복 제거, 오류 추적, 구조화된 로깅, 백업 자동화
**Depends on**: Phase 9
**Requirements**: PERF-05, PERF-06, MONITOR-01, MONITOR-02, MONITOR-03, DEBT-01, DEBT-02
**Success Criteria** (what must be TRUE):
  1. 코드 중복 제거됨 (fetchReportData를 공유 모듈로 추출)
  2. 애플리케이션 오류가 Sentry에서 추적되고 읽기 쉬운 스택 트레이스로 집계
  3. 로그가 JSON 형식으로 구조화되고 요청 ID 추적으로 디버깅 가능
  4. 데이터베이스 백업이 스케줄대로 자동 실행되고 보관 정책 적용
  5. 번들 크기가 분석되고 코드 스플리팅이 최적화됨
  6. 병렬 데이터 페칭으로 페이지 로드 시간 단축
  7. Phase 1 VERIFICATION.md 파일 생성됨
**Plans**: TBD

Plans:
- [ ] 10-01: 코드 중복 제거 (fetchReportData 추출)
- [ ] 10-02: Sentry 오류 추적 통합
- [ ] 10-03: 구조화된 로깅 구현
- [ ] 10-04: 데이터베이스 백업 자동화
- [ ] 10-05: 코드 스플리팅 최적화
- [ ] 10-06: 병렬 데이터 페칭 구현
- [ ] 10-07: Phase 1용 VERIFICATION.md 생성

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
| 8. Production Infrastructure Foundation | v1.1 | 0/8 | Not started | - |
| 9. Performance & Database Optimization | v1.1 | 0/5 | Not started | - |
| 10. Technical Debt Resolution & Monitoring | v1.1 | 0/7 | Not started | - |

**Overall Progress:** 36/61 plans complete (59%)
