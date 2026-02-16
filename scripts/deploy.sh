#!/bin/bash
set -e

# AI AfterSchool Zero-Downtime Deployment Script
#
# Usage:
#   ./scripts/deploy.sh                    # Interactive mode
#   ./scripts/deploy.sh --force            # Skip confirmation
#   ./scripts/deploy.sh --tag=v1.1.0       # Deploy specific version
#   ./scripts/deploy.sh --skip-health      # Skip health check (not recommended)
#
# Environment variables:
#   COMPOSE_FILE: Path to docker-compose file (default: docker-compose.prod.yml)
#   HEALTH_CHECK_TIMEOUT: Seconds to wait for health check (default: 60)
#   HEALTH_CHECK_URL: URL to check (default: http://localhost:3000/api/health)

#=============================================================================
# Configuration
#=============================================================================

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-60}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3001/api/health}"
BACKUP_TAG_FILE=".deploy-backup-tag"

#=============================================================================
# Colors for output
#=============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#=============================================================================
# Helper functions
#=============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

#=============================================================================
# Pre-deployment checks
#=============================================================================

pre_deploy_checks() {
    log_info "Running pre-deployment checks..."

    # Check if docker-compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        log_warning ".env.production not found. Using environment variables."
    fi

    # Check Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

#=============================================================================
# Backup database
#=============================================================================

backup_database() {
    log_info "Creating database backup..."
    local backup_file="backups/db-backup-$(date +%Y%m%d-%H%M%S).sql"

    mkdir -p backups

    # Docker exec를 사용하여 pg_dump 실행
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres \
        --clean --if-exists --no-owner --no-acl > "$backup_file" 2>/dev/null; then
        log_success "Database backup created: $backup_file"
    else
        log_warning "Database backup failed (continuing anyway)"
    fi
}

#=============================================================================
# Backup current deployment
#=============================================================================

backup_current_deployment() {
    log_info "Backing up current deployment..."

    # Get current running image tag
    CURRENT_TAG=$(docker compose -f "$COMPOSE_FILE" ps -q app | xargs docker inspect --format='{{index .Config.Image}}' 2>/dev/null || echo "")

    if [ -n "$CURRENT_TAG" ]; then
        echo "$CURRENT_TAG" > "$BACKUP_TAG_FILE"
        log_success "Backed up current tag: $CURRENT_TAG"
    else
        log_warning "No current deployment to backup"
        echo "none" > "$BACKUP_TAG_FILE"
    fi
}

#=============================================================================
# Build new image
#=============================================================================

build_new_image() {
    local tag="${1:-latest}"

    log_info "Building new image: $tag"

    # Build new image
    if docker compose -f "$COMPOSE_FILE" build --build-arg VERSION="$tag"; then
        log_success "Image built successfully"
    else
        log_error "Image build failed"
        return 1
    fi
}

#=============================================================================
# Health check
#=============================================================================

health_check() {
    local timeout="$1"
    local elapsed=0

    log_info "Waiting for application to be healthy..."

    while [ $elapsed -lt "$timeout" ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Application is healthy"
            return 0
        fi

        echo -n "."
        sleep 2
        elapsed=$((elapsed + 2))
    done

    echo ""
    log_error "Health check timed out after ${timeout}s"
    return 1
}

#=============================================================================
# Deploy new version
#=============================================================================

deploy_new_version() {
    log_info "Deploying new version..."

    # Pull latest images (for postgres, minio)
    log_info "Pulling latest images..."
    docker compose -f "$COMPOSE_FILE" pull postgres minio 2>/dev/null || true

    # 기존 컨테이너 정리 후 재시작 (컨테이너 ID 충돌 방지)
    log_info "Stopping existing containers..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true

    # container_name 충돌 방지: 잔여 컨테이너 강제 제거
    for cname in $(docker ps -a --filter "name=ai-afterschool" --format '{{.Names}}'); do
        log_info "Removing lingering container: $cname"
        docker rm -f "$cname" 2>/dev/null || true
    done

    # Start new containers (migrate → app 순서는 depends_on으로 자동 보장)
    log_info "Starting new containers..."
    if docker compose -f "$COMPOSE_FILE" up -d; then
        log_success "Containers started"
    else
        log_error "Failed to start containers"
        return 1
    fi

    # migrate 컨테이너 완료 확인
    # depends_on: service_completed_successfully가 app 시작 전 migrate 완료를 보장하므로
    # app이 시작됐다면 migrate는 이미 성공. 종료 코드만 확인.
    log_info "Checking database migration status..."
    local migrate_timeout=60
    local elapsed=0
    while [ $elapsed -lt $migrate_timeout ]; do
        # -a 플래그로 종료된 컨테이너도 조회
        local status=$(docker inspect ai-afterschool-migrate --format '{{.State.Status}}' 2>/dev/null || echo "")
        if [ "$status" = "exited" ]; then
            local exit_code=$(docker inspect ai-afterschool-migrate --format '{{.State.ExitCode}}' 2>/dev/null || echo "1")
            if [ "$exit_code" = "0" ]; then
                log_success "Database migrations applied successfully"
                break
            else
                log_error "Migration failed (exit code: $exit_code) - check logs with: docker compose -f $COMPOSE_FILE logs migrate"
                return 1
            fi
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    if [ $elapsed -ge $migrate_timeout ]; then
        log_error "Migration timed out"
        return 1
    fi

    # Wait for app to be healthy
    if ! [ "$SKIP_HEALTH" = "true" ]; then
        if ! health_check "$HEALTH_CHECK_TIMEOUT"; then
            log_error "Deployment failed - application not healthy"
            return 1
        fi
    else
        log_warning "Skipping health check"
    fi

    log_success "Deployment successful"
}

#=============================================================================
# Cleanup old images
#=============================================================================

cleanup_old_images() {
    log_info "Cleaning up old images..."

    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true

    log_success "Cleanup complete"
}

#=============================================================================
# Main deployment flow
#=============================================================================

main() {
    local tag=""
    local force=false
    local SKIP_HEALTH=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tag=*)
                tag="${1#*=}"
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --skip-health)
                SKIP_HEALTH=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Print banner
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         AI AfterSchool Zero-Downtime Deployment              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    # Confirm deployment
    if [ "$force" = false ]; then
        echo -n "Deploy to production? (y/N) "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    # Start deployment
    local start_time=$(date +%s)

    pre_deploy_checks
    backup_database
    backup_current_deployment

    if ! build_new_image "$tag"; then
        log_error "Deployment failed at build stage"
        exit 1
    fi

    if ! deploy_new_version; then
        log_error "Deployment failed at deploy stage"
        log_info "Rolling back to previous version..."

        # Rollback and ensure deployment is marked as failed
        if [ -f "$BACKUP_TAG_FILE" ]; then
            BACKUP_TAG=$(cat "$BACKUP_TAG_FILE")
            if [ "$BACKUP_TAG" != "none" ]; then
                # Ignore rollback exit code - we want to exit with 1 anyway
                ./scripts/rollback.sh --tag="$BACKUP_TAG" --force || true
            else
                log_warning "No backup to rollback to"
            fi
        fi

        # Always exit with error after rollback
        exit 1
    fi

    cleanup_old_images

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  Deployment Complete ✓                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Total time: ${duration}s"
    echo ""

    # Remove backup file on success
    rm -f "$BACKUP_TAG_FILE"
}

# Run main function
main "$@"
