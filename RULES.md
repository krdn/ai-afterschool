# AI 전역 행동 수칙 (Global Rules)

이 설정은 이 시스템의 모든 프로젝트에 공통으로 적용됩니다.

1. **언어 (Language)**:
   - 사용자와의 모든 대화는 **한국어**로 진행합니다.
   - 영어 입력에 대해서도 답변은 한국어로 합니다.

2. **문서 (Artifacts)**:
   - 모든 생성 문서(기획서, 태스크 리스트 등)는 **한국어**로 작성합니다.

3. **코드 및 개발 규칙 (Code & Dev Standards)**:
   - **주석**: 한국어 작성을 원칙으로 하며, 주요 API/함수에는 JSDoc을 적극 활용합니다.
   - **패키지 매니저**: `npm` 사용을 기본으로 합니다.
   - **보안**: 비밀번호, API 키 등 민감 정보는 반드시 `.env` 파일로 관리하며 코드에 하드코딩하지 않습니다.

4. **개발 프로세스 및 환경 (Lifecycle & Environment)**:

   - **개발 (Development)**:
     - 위치: 로컬 환경 (Local Machine)
     - 커밋 메시지: Conventional Commits 준수 (예: `feat: 기능 추가`, `fix: 버그 수정`)
     - Timezone: **Asia/Seoul (KST)**

   - **배포 (Deployment)**:
     - 표준: **Docker** 사용 (모든 프로젝트에 `Dockerfile`, `docker-compose.yml` 포함)
     - **볼륨 (Volume)**: 데이터 유실 방지를 위해 Host bind mount (`./data` 또는 `./volumes`) 사용
     - **네트워크**: 웹 서비스는 호스트의 0.0.0.0에 직접 노출하지 않고, Reverse Proxy 사용을 전제로 로컬 포트(127.0.0.1)만 매핑하는 것을 권장합니다.

   - **운영 (Operations)**:
     - 위치: **`192.168.0.5`** (Ubuntu Server)
     - 배포 대상 서버이며, 데이터베이스도 이곳에서 동작합니다.
