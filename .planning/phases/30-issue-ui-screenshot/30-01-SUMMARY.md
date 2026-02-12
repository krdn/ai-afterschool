---
phase: 30-issue-ui-screenshot
plan: 01
subsystem: ui

tags:
  - modern-screenshot
  - minio
  - s3
  - image-storage
  - screenshot

requires:
  - phase: 29-issue-db-github
    provides: MinIO S3 storage configuration, Issue Prisma model with screenshotUrl field
  - phase: 09-storage
    provides: S3PDFStorage pattern for image storage adaptation

provides:
  - Screenshot capture utility with modern-screenshot
  - Image upload service for MinIO S3
  - Blob-based capture and upload pipeline
  - Singleton pattern for image storage

affects:
  - Phase 30-02 (Issue Report UI Components)
  - Phase 30-03 (Screenshot Preview & Annotation)

tech-stack:
  added:
    - modern-screenshot@4.6.8
  patterns:
    - Singleton pattern for storage service
    - S3-compatible storage adapter
    - Blob-based image pipeline

key-files:
  created:
    - src/lib/screenshot/capture.ts
    - src/lib/storage/image-storage.ts
  modified:
    - package.json

key-decisions:
  - "modern-screenshot 선택: 20KB, html2canvas보다 3x 빠름"
  - "S3PDFStorage 패턴 재사용: 이미지 특화 인터페이스 추가"
  - "Blob 기반 파이프라인: 캡처 → 업로드 직접 연결"
  - "싱글톤 패턴: getImageStorage()로 지연 초기화"

patterns-established:
  - "Image storage: S3ImageStorage 클래스로 이미지 특화 기능 제공"
  - "Screenshot capture: captureScreenshot(), captureElement() 두 가지 모드"
  - "Error handling: CORS 이슈, 요소 미발견 등 사용자 친화적 메시지"

duration: 4 min
completed: 2026-02-12
---

# Phase 30 Plan 01: 화면 캡처 및 이미지 업로드 인프라 구축

**Screenshot capture utility with modern-screenshot (20KB, 3x faster than html2canvas) and MinIO S3 image storage service**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T08:33:38Z
- **Completed:** 2026-02-12T08:37:00Z
- **Tasks:** 3/3 completed
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- modern-screenshot 라이브러리 설치 (4.6.8)
- 스크린샷 캡처 유틸리티 구현 (captureScreenshot, captureElement)
- 이미지 스토리지 서비스 구현 (S3ImageStorage 클래스)
- Blob 기반 캡처 → 업로드 파이프라인 완성

## Task Commits

각 태스크는 원자적으로 커밋되었습니다:

1. **Task 1: modern-screenshot 라이브러리 설치** - `afb46e7` (chore)
2. **Task 2: 스크린샷 캡처 유틸리티 생성** - `ab5b324` (feat)
3. **Task 3: 이미지 스토리지 서비스 생성** - `af9e447` (feat)

**Plan metadata:** `{metadata_commit}` (docs: complete plan)

## Files Created/Modified

- `package.json` - modern-screenshot 의존성 추가
- `src/lib/screenshot/capture.ts` - 스크린샷 캡처 유틸리티
  - `captureScreenshot()`: 전체 화면 캡처
  - `captureElement(selector)`: 특정 요소 캡처
  - `blobToFile()`, `blobToDataUrl()`: 변환 유틸리티
- `src/lib/storage/image-storage.ts` - 이미지 업로드 서비스
  - `S3ImageStorage` 클래스: S3-compatible storage
  - `uploadImage(blob)`: Blob → S3 업로드
  - `getImageUrl(filename)`: 공개 URL 생성
  - `imageStorage` 싱글톤: 편의용 export

## Decisions Made

- **modern-screenshot 선택**: 20KB 크기, html2canvas보다 3배 빠른 성능
- **S3PDFStorage 패턴 재사용**: 기존 MinIO 설정 활용, 이미지 특화 인터페이스 추가
- **Blob 기반 파이프라인**: 캡처 결과를 Blob으로 반환하여 업로드와 직접 연결
- **싱글톤 패턴**: `getImageStorage()`로 지연 초기화하여 환경 변수 로드 최적화

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] modern-screenshot API 수정**

- **Found during:** Task 2 (스크린샷 캡처 유틸리티 생성)
- **Issue:** `exclude` 옵션이 modern-screenshot에 존재하지 않음 (타입 오류)
- **Fix:** `filter` 옵션으로 변경 (modern-screenshot의 실제 API)
- **Files modified:** src/lib/screenshot/capture.ts
- **Verification:** TypeScript 컴파일 에러 해결
- **Committed in:** ab5b324 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** API 호환성 수정, 기능 변경 없음

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

단, 이미지 업로드 기능 사용을 위해서는 기존 MinIO 설정이 필요합니다:
- `MINIO_ENDPOINT`
- `MINIO_BUCKET` (또는 `MINIO_IMAGE_BUCKET`)
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`

## Next Phase Readiness

- Phase 30-02 준비 완료: Issue Report UI Components
- Phase 30-03 준비 완료: Screenshot Preview & Annotation
- capture.ts와 image-storage.ts가 Blob 기반으로 상호 운용 가능

---
*Phase: 30-issue-ui-screenshot*
*Completed: 2026-02-12*
