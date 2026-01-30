# Requirements: AI AfterSchool v1.1

**정의일:** 2026-01-30
**Core Value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공

## v1.1 Requirements

프로덕션 배포 준비를 위한 요구사항입니다. 각 요구사항은 로드맵 Phase에 매핑됩니다.

### Production Deployment (DEPLOY)

프로덕션 환경 배포를 위한 인프라 요구사항입니다.

- [ ] **DEPLOY-01**: Docker Compose 프로덕션 환경을 구성할 수 있다 (멀티스테이지 빌드, 헬스 체크)
- [ ] **DEPLOY-02**: Caddy 리버스 프록시로 자동 SSL/TLS 인증서를 설정할 수 있다
- [ ] **DEPLOY-03**: `/api/health` 엔드포인트로 DB 연결 상태를 확인할 수 있다
- [ ] **DEPLOY-04**: `.dockerignore`로 환경변수 파일을 Docker 이미지에서 제외할 수 있다
- [ ] **DEPLOY-05**: 환경별 (dev/staging/prod) 설정 파일을 분리해서 관리할 수 있다
- [x] **DEPLOY-06**: `prisma migrate deploy`로 데이터베이스 마이그레이션을 자동화할 수 있다
- [ ] **DEPLOY-07**: 영배포 (zero-downtime) 배포 전략을 구현할 수 있다
- [ ] **DEPLOY-08**: 배포 실패 시 자동 롤백을 수행할 수 있다

### Storage Migration (STORAGE)

PDF 저장소 마이그레이션을 위한 요구사항입니다.

- [ ] **STORAGE-01**: MinIO S3 호환 스토리지를 Docker Compose로 실행할 수 있다
- [ ] **STORAGE-02**: PDF 저장 추상화 인터페이스를 구현할 수 있다 (로컬/MinIO 전환 가능)
- [ ] **STORAGE-03**: 기존 로컬 파일시스템 PDF를 MinIO로 이관하는 스크립트를 실행할 수 있다
- [ ] **STORAGE-04**: Presigned URL로 보안 PDF 다운로드를 제공할 수 있다

### Performance Optimization (PERF)

성능 최적화를 위한 요구사항입니다.

- [x] **PERF-01**: Prisma Singleton 패턴으로 연결 풀링을 구현할 수 있다 (connection_limit=10)
- [x] **PERF-02**: Prisma `include`로 N+1 쿼리 문제를 해결할 수 있다
- [x] **PERF-03**: 자주 조회하는 필드에 데이터베이스 인덱스를 생성할 수 있다
- [x] **PERF-04**: Next.js `<Image>` 컴포넌트로 이미지 최적화를 적용할 수 있다 (WebP/AVIF 변환)
- [ ] **PERF-05**: `Promise.all()`로 병렬 데이터 페칭을 구현할 수 있다
- [ ] **PERF-06**: 코드 스플리팅을 최적화하고 번들 크기를 분석할 수 있다

### Monitoring & Operations (MONITOR)

모니터링 및 운영을 위한 요구사항입니다.

- [ ] **MONITOR-01**: Sentry로 오류 추적을 구현할 수 있다 (소스맵 업로드 포함)
- [ ] **MONITOR-02**: `pg_dump`로 데이터베이스 백업을 자동화할 수 있다 (cron, 보관 정책)
- [ ] **MONITOR-03**: JSON 기반 구조화된 로깅을 구현할 수 있다 (요청 ID 추적)

### Technical Debt (DEBT)

기술 부채 해결을 위한 요구사항입니다.

- [ ] **DEBT-01**: `fetchReportData()` 함수 중복을 해제하고 `src/lib/db/reports.ts`로 추출할 수 있다
- [ ] **DEBT-02**: Phase 1에 누락된 VERIFICATION.md 파일을 생성할 수 있다

## v2 Requirements

다음 마일스톤으로 연기된 요구사항입니다.

### Performance (PERF)

- **PERF-07**: Redis 캐싱 레이어를 도입할 수 있다 (Next.js 내장 캐시 부족 시)
- **PERF-08**: Core Web Vitals 모니터링을 구현할 수 있다

### Monitoring (MONITOR)

- **MONITOR-04**: 느린 쿼리 감지 및 알림을 구현할 수 있다
- **MONITOR-05**: 완전한 APM (분산 추적)을 도입할 수 있다

## Out of Scope

명시적으로 제외된 기능입니다.

| Feature | Reason |
|---------|--------|
| Kubernetes 배포 | 단일 서버 배포에는 Docker Compose로 충분, 복잡도 과도 |
| 다중 리전 CDN | 단일 조직 배포, 비용 대비 효과 낮음 |
| 실시간 웹소켓 | 현재 요구사항 없음, 필요 시 v2+ 검토 |
| 마이크로서비스 아키텍처 | 모놀리식 Next.js로 충분, 분리 필요성 낮음 |
| 완전한 CI/CD 파이프라인 | v1.1은 수동 배포 자동화, GitHub Actions는 v2+ |

## Traceability

Phase가 요구사항을 커버하는지 추적합니다. 로드맵 생성 시 업데이트됩니다.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 8 | Pending |
| DEPLOY-02 | Phase 8 | Pending |
| DEPLOY-03 | Phase 8 | Pending |
| DEPLOY-04 | Phase 8 | Pending |
| DEPLOY-05 | Phase 8 | Pending |
| DEPLOY-06 | Phase 9 | Complete |
| DEPLOY-07 | Phase 8 | Pending |
| DEPLOY-08 | Phase 8 | Pending |
| STORAGE-01 | Phase 8 | Pending |
| STORAGE-02 | Phase 8 | Pending |
| STORAGE-03 | Phase 8 | Pending |
| STORAGE-04 | Phase 8 | Pending |
| PERF-01 | Phase 9 | Complete |
| PERF-02 | Phase 9 | Complete |
| PERF-03 | Phase 9 | Complete |
| PERF-04 | Phase 9 | Complete |
| PERF-05 | Phase 10 | Pending |
| PERF-06 | Phase 10 | Pending |
| MONITOR-01 | Phase 10 | Pending |
| MONITOR-02 | Phase 10 | Pending |
| MONITOR-03 | Phase 10 | Pending |
| DEBT-01 | Phase 10 | Pending |
| DEBT-02 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after initial definition*
