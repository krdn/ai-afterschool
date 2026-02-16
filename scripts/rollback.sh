#!/bin/bash
set -e

# AI AfterSchool Rollback Script
#
# Usage:
#   ./scripts/rollback.sh                    # Rollback to previous version
#   ./scripts/rollback.sh --tag=v1.0.0        # Rollback to specific tag
#   ./scripts/rollback.sh --force            # Skip confirmation

#=============================================================================
# Configuration
#=============================================================================

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-60}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3001/api/health}"

#=============================================================================
# Colors
#=============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
# Get previous version
#=============================================================================

get_previous_version() {
    if [ -f ".deploy-backup-tag" ]; then
        cat ".deploy-backup-tag"
    else
        # Try to get from docker images
        docker images --format '{{.Tag}}' | grep -E '^[0-9]' | sort -V | tail -2 | head -1
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
    log_error "Health check timed out"
    return 1
}

#=============================================================================
# Rollback deployment
#=============================================================================

rollback_deployment() {
    local target_tag="$1"

    if [ -z "$target_tag" ] || [ "$target_tag" = "none" ]; then
        log_error "No version to rollback to"
        exit 1
    fi

    log_info "Rolling back to: $target_tag"

    # Stop current containers (--remove-orphans로 고아 컨테이너 정리)
    log_info "Stopping current containers..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans

    # Start with previous version
    log_info "Starting previous version..."
    docker compose -f "$COMPOSE_FILE" up -d

    # Health check
    if ! health_check "$HEALTH_CHECK_TIMEOUT"; then
        log_error "Rollback failed - application not healthy"
        log_error "Manual intervention may be required"
        exit 1
    fi

    log_success "Rollback complete"
}

#=============================================================================
# Main
#=============================================================================

main() {
    local tag=""
    local force=false

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
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              AI AfterSchool Rollback                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    # Get target version
    if [ -z "$tag" ]; then
        tag=$(get_previous_version)
        log_info "Auto-detected previous version: $tag"
    fi

    # Confirm rollback
    if [ "$force" = false ]; then
        echo -n "Rollback to version '$tag'? (y/N) "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi

    local start_time=$(date +%s)

    rollback_deployment "$tag"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    log_success "Rollback complete in ${duration}s"
    echo ""
}

main "$@"
