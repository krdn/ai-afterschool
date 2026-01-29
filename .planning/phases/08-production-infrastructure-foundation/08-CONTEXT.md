# Phase 8: Production Infrastructure Foundation - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Docker 기반 프로덕션 배포 인프라 구축. 단일 서버 환경에서 SSL, S3 호환 PDF 저장소(MinIO), 헬스 모니터링, 무중단 배포를 포함한 완전한 프로덕션 배포 시스템을 구축합니다.

</domain>

<decisions>
## Implementation Decisions

### 배포 전략 (Deployment Strategy)
- **단일 서버 All-in-one 배포**: 모든 서비스를 하나의 docker-compose.yaml로 배포
- **롤링 배포 (Rolling Deployment)**: docker-compose up --build로 컨테이너 교체
- **순차적 재시작**: 서비스 의존성 순서대로 재시작 (db → app → proxy)
- **CI/CD 파이프라인**: GitHub Actions 또는 GitLab CI로 자동화된 배포 파이프라인 구축

### SSL/HTTPS 설정
- **Let's Encrypt 자동 발급**: Caddy가 도메인 검증 후 자동으로 인증서 발급/갱신
- **프로덕션 도메인 사용**: 운영 환경용 도메인 (ai-afterschool.example.com 등)으로 HTTPS 제공
- **선택적 포트 노출**: Caddy가 80, 443을 listen하고, 일부 서비스 포트도 개발 편의상 외부 노출
- **HTTPS 강제**: HTTP 트래픽은 HTTPS로 리디렉션

### S3 호환 스토리지 (MinIO)
- **Docker 영구 볼륨 사용**: Docker 볼륨을 사용하여 컨테이너 삭제 후에도 데이터 보존
- **관리 콘솔 노출**: MinIO 관리 콘솔을 9001 포트에 노출하여 웹 기반 관리 가능
- **일회성 PDF 마이그레이션**: 로컬 PDF 파일을 MinIO로 일회성 이관 후 로컬 파일 삭제
- **Presigned URL 보안**: PDF 다운로드는 일회용 presigned URL로 제한된 시간만 제공

### 무중단 배포 (Zero-Downtime Deployment)
- **자동 롤백 스크립트**: 배포 실패 시 이전 이미지 태그로 자동 롤백하는 스크립트 제공
- **헬스체크 기반 트래픽 전환**: /api/health가 200을 반환할 때까지 대기 후 트래픽 전환
- **60초 헬스체크 타임아웃**: 컨테이너 시작 후 최대 60초 대기, 실패 시 롤백
- **유지보수 모드**: 배포 중 사용자에게 유지보수 모드 페이지 표시

### Claude's Discretion
- Docker Compose 버전 선택
- Caddy 구성 파일 상세 설정
- MinIO 버킷 정책 및 접근 제어 상세 설정
- CI/CD 파이프라인 구체적인 구현 선택 (GitHub Actions vs GitLab CI vs Jenkins)

</decisions>

<specifics>
## Specific Ideas

- 단일 서버 배포로 복잡도를 최소화하고 관리 용이성 확보
- Caddy를 선택한 이유: Nginx보다 SSL 자동화가 간단하고 설정이 YAML 기반으로 직관적
- MinIO는 로컬 환경에서도 S3 API 호환성을 제공하여 클라우드 전환 시 이전 용이
- 헬스체크는 배포 안정성을 위한 핵심 메커니즘

</specifics>

<deferred>
## Deferred Ideas

- 멀티 서버 배포 (로드 밸런서, 컨테이너 오케스트레이션) — v2.0 이후 고려
- 클라우드 S3 마이그레이션 — Phase 9 또는 v2.0
- Blue-Green 배포 — 멀티 서버 환경에서 고려
- 고가용성 (HA) 구성 — v2.0 이후

</deferred>

---

*Phase: 08-production-infrastructure-foundation*
*Context gathered: 2026-01-30*
