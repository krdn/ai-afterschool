#!/bin/bash
# GitHub Actions Self-hosted Runner 설치 스크립트
# 실행 위치: 192.168.0.8 (로컬 개발 머신)
#
# 사전 요구사항:
# 1. GitHub repo > Settings > Actions > Runners > New self-hosted runner
#    에서 토큰을 발급받아 RUNNER_TOKEN 환경변수로 전달
# 2. Claude Code CLI 설치: npm i -g @anthropic-ai/claude-code
#
# 사용법:
#   RUNNER_TOKEN=<token> GITHUB_OWNER=<owner> GITHUB_REPO=<repo> ./scripts/setup-runner.sh

set -euo pipefail

# 설정
RUNNER_DIR="${RUNNER_DIR:-/home/gon/actions-runner}"
RUNNER_NAME="${RUNNER_NAME:-ai-afterschool-runner}"
RUNNER_LABELS="self-hosted,linux,ai-fix"
RUNNER_VERSION="2.321.0"

# 필수 환경변수 체크
: "${RUNNER_TOKEN:?RUNNER_TOKEN 환경변수가 필요합니다}"
: "${GITHUB_OWNER:?GITHUB_OWNER 환경변수가 필요합니다}"
: "${GITHUB_REPO:?GITHUB_REPO 환경변수가 필요합니다}"

echo "=== GitHub Actions Self-hosted Runner 설치 ==="
echo "디렉토리: $RUNNER_DIR"
echo "이름: $RUNNER_NAME"
echo "라벨: $RUNNER_LABELS"

# 1. 디렉토리 생성
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# 2. Runner 다운로드
echo ">>> Runner 다운로드 (v$RUNNER_VERSION)..."
curl -o actions-runner-linux-x64.tar.gz -L \
  "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
tar xzf actions-runner-linux-x64.tar.gz
rm actions-runner-linux-x64.tar.gz

# 3. Runner 설정
echo ">>> Runner 설정..."
./config.sh \
  --url "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work "_work" \
  --replace

# 4. systemd 서비스 설치
echo ">>> systemd 서비스 설치..."
sudo ./svc.sh install "$USER"
sudo ./svc.sh start

echo ""
echo "=== 설치 완료 ==="
echo "상태 확인: sudo ./svc.sh status"
echo "로그 확인: journalctl -u actions.runner.${GITHUB_OWNER}-${GITHUB_REPO}.${RUNNER_NAME} -f"
echo ""
echo "=== 필요한 GitHub Secrets ==="
echo "  ANTHROPIC_API_KEY     - Claude Code API 키"
echo "  INTERNAL_API_SECRET   - 내부 API 인증 시크릿 (openssl rand -hex 32)"
echo "  APP_URL               - 앱 URL (예: http://192.168.0.5:3001)"
echo "  REVIEWER_USERNAME     - PR 리뷰어 GitHub 사용자명"
echo "  DATABASE_URL_TEST     - 테스트용 DB URL"
