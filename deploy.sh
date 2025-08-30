#!/bin/bash

# ShareNear Deployment Script
set -e

echo "🚀 ShareNear Deployment Script"
echo "=============================="

# Configuration
APP_NAME="sharenear"
DOCKER_REGISTRY="your-registry.com"
VERSION=${1:-latest}
ENVIRONMENT=${2:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Build production image
    docker build -f Dockerfile.prod -t ${APP_NAME}:${VERSION} .
    
    # Tag for registry if specified
    if [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        docker tag ${APP_NAME}:${VERSION} ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}
        docker tag ${APP_NAME}:${VERSION} ${DOCKER_REGISTRY}/${APP_NAME}:latest
    fi
    
    log_success "Application built successfully"
}

# Push to registry
push_to_registry() {
    if [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        log_info "Pushing to registry..."
        docker push ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}
        docker push ${DOCKER_REGISTRY}/${APP_NAME}:latest
        log_success "Images pushed to registry"
    else
        log_warning "No registry configured, skipping push"
    fi
}

# Deploy locally
deploy_local() {
    log_info "Deploying locally..."
    
    # Stop existing containers
    docker compose -f docker-compose.prod.yml down
    
    # Start new containers
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for health check
    log_info "Waiting for application to be healthy..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application is healthy and running"
        log_info "Access your application at: http://localhost:3000"
    else
        log_error "Application health check failed"
        docker compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Deploy to remote server
deploy_remote() {
    local server=$1
    log_info "Deploying to remote server: $server"
    
    # Copy files to server
    scp docker-compose.prod.yml .env.production nginx.conf $server:~/sharenear/
    
    # Execute deployment on remote server
    ssh $server << EOF
        cd ~/sharenear
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml down
        docker compose -f docker-compose.prod.yml up -d
        
        # Wait and check health
        sleep 15
        if curl -f http://localhost:3000/api/health; then
            echo "Deployment successful"
        else
            echo "Deployment failed"
            docker compose -f docker-compose.prod.yml logs
            exit 1
        fi
EOF
    
    log_success "Remote deployment completed"
}

# Rollback function
rollback() {
    local previous_version=$1
    log_warning "Rolling back to version: $previous_version"
    
    docker compose -f docker-compose.prod.yml down
    docker tag ${APP_NAME}:${previous_version} ${APP_NAME}:latest
    docker compose -f docker-compose.prod.yml up -d
    
    log_success "Rollback completed"
}

# Backup function
backup() {
    log_info "Creating backup..."
    
    # Backup volumes
    docker run --rm -v sharenear_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
    
    log_success "Backup created"
}

# Main deployment flow
main() {
    case "${3:-deploy}" in
        "build")
            check_prerequisites
            build_app
            ;;
        "deploy")
            check_prerequisites
            build_app
            push_to_registry
            deploy_local
            ;;
        "remote")
            if [ -z "$4" ]; then
                log_error "Server address required for remote deployment"
                echo "Usage: $0 <version> <environment> remote <server>"
                exit 1
            fi
            check_prerequisites
            build_app
            push_to_registry
            deploy_remote $4
            ;;
        "rollback")
            if [ -z "$4" ]; then
                log_error "Previous version required for rollback"
                echo "Usage: $0 <version> <environment> rollback <previous_version>"
                exit 1
            fi
            rollback $4
            ;;
        "backup")
            backup
            ;;
        *)
            echo "Usage: $0 [version] [environment] [action] [options]"
            echo ""
            echo "Actions:"
            echo "  build              - Build Docker images only"
            echo "  deploy (default)   - Build and deploy locally"
            echo "  remote <server>    - Deploy to remote server"
            echo "  rollback <version> - Rollback to previous version"
            echo "  backup             - Create backup of data"
            echo ""
            echo "Examples:"
            echo "  $0                           # Deploy latest version locally"
            echo "  $0 v1.2.0 production deploy # Deploy specific version"
            echo "  $0 latest prod remote user@server.com"
            echo "  $0 latest prod rollback v1.1.0"
            ;;
    esac
}

# Run main function
main "$@"