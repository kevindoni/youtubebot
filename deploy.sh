#!/bin/bash

# YouTube Bot Deployment Script
# Supports multiple environments: development, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="youtube-bot"
DEFAULT_ENV="production"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_usage() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  dev, development    - Development environment"
    echo "  staging            - Staging environment"
    echo "  prod, production   - Production environment (default)"
    echo ""
    echo "Options:"
    echo "  --docker          - Deploy using Docker"
    echo "  --pm2             - Deploy using PM2"
    echo "  --update          - Update existing deployment"
    echo "  --monitoring      - Include monitoring stack"
    echo "  --ssl             - Setup SSL certificates"
    echo "  --backup          - Create backup before deployment"
    echo "  --rollback        - Rollback to previous deployment"
    echo "  --status          - Show deployment status"
    echo "  --logs            - Show application logs"
    echo "  --help, -h        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production --docker --monitoring"
    echo "  $0 dev --pm2"
    echo "  $0 --status"
    echo "  $0 --rollback"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if ! node -e "process.exit(process.version.slice(1).localeCompare('$REQUIRED_VERSION', undefined, {numeric: true}) >= 0 ? 0 : 1)"; then
        log_error "Node.js version $REQUIRED_VERSION or higher is required (current: $NODE_VERSION)"
        exit 1
    fi
    
    log_success "Node.js version $NODE_VERSION is compatible"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check Docker if needed
    if [[ "$USE_DOCKER" == "true" ]]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker is not installed"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            log_error "Docker Compose is not installed"
            exit 1
        fi
        
        log_success "Docker and Docker Compose are available"
    fi
    
    # Check PM2 if needed
    if [[ "$USE_PM2" == "true" ]]; then
        if ! command -v pm2 &> /dev/null; then
            log_warning "PM2 is not installed globally. Installing..."
            npm install -g pm2
        fi
        
        log_success "PM2 is available"
    fi
}

setup_environment() {
    log_info "Setting up $ENVIRONMENT environment..."
    
    # Create directories
    mkdir -p logs data backups
    
    # Copy environment file
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_warning "Created .env file from .env.example. Please configure it."
        else
            log_error ".env file not found and no .env.example available"
            exit 1
        fi
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --only=production
    
    log_success "Environment setup completed"
}

create_backup() {
    if [[ "$CREATE_BACKUP" == "true" ]]; then
        log_info "Creating backup..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup data and logs
        if [[ -d "data" ]]; then
            cp -r data "$BACKUP_DIR/"
        fi
        
        if [[ -d "logs" ]]; then
            cp -r logs "$BACKUP_DIR/"
        fi
        
        # Backup configuration
        if [[ -f ".env" ]]; then
            cp .env "$BACKUP_DIR/"
        fi
        
        log_success "Backup created in $BACKUP_DIR"
    fi
}

deploy_docker() {
    log_info "Deploying with Docker..."
    
    # Build and start services
    if [[ "$INCLUDE_MONITORING" == "true" ]]; then
        log_info "Starting with monitoring stack..."
        docker-compose up -d
    else
        log_info "Starting core services only..."
        docker-compose up -d youtube-bot redis nginx
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 10
    
    # Health check
    if curl -f http://localhost:3000/ping > /dev/null 2>&1; then
        log_success "Docker deployment successful"
    else
        log_error "Docker deployment failed - health check failed"
        exit 1
    fi
}

deploy_pm2() {
    log_info "Deploying with PM2..."
    
    # Stop existing processes
    if pm2 list | grep -q "$PROJECT_NAME"; then
        log_info "Stopping existing PM2 processes..."
        pm2 stop ecosystem.config.js
    fi
    
    # Start new processes
    if [[ "$ENVIRONMENT" == "development" ]]; then
        pm2 start ecosystem.config.js:youtube-bot-single --env development
    else
        pm2 start ecosystem.config.js --env production
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    log_success "PM2 deployment successful"
}

show_status() {
    log_info "Deployment Status:"
    echo ""
    
    if [[ "$USE_DOCKER" == "true" ]]; then
        echo "Docker Services:"
        docker-compose ps
        echo ""
        
        echo "Health Check:"
        if curl -f http://localhost:3000/ping > /dev/null 2>&1; then
            log_success "Application is healthy"
        else
            log_error "Application health check failed"
        fi
    elif [[ "$USE_PM2" == "true" ]]; then
        echo "PM2 Processes:"
        pm2 status
        echo ""
        
        echo "Health Check:"
        if curl -f http://localhost:3000/ping > /dev/null 2>&1; then
            log_success "Application is healthy"
        else
            log_error "Application health check failed"
        fi
    else
        log_info "No deployment method specified"
    fi
}

show_logs() {
    log_info "Application Logs:"
    
    if [[ "$USE_DOCKER" == "true" ]]; then
        docker-compose logs --tail=50 -f youtube-bot
    elif [[ "$USE_PM2" == "true" ]]; then
        pm2 logs --lines 50
    else
        tail -n 50 -f logs/*.log
    fi
}

rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t backups/ | head -n1)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to backup: $LATEST_BACKUP"
    
    # Stop current deployment
    if [[ "$USE_DOCKER" == "true" ]]; then
        docker-compose down
    elif [[ "$USE_PM2" == "true" ]]; then
        pm2 stop all
    fi
    
    # Restore backup
    if [[ -d "backups/$LATEST_BACKUP/data" ]]; then
        rm -rf data
        cp -r "backups/$LATEST_BACKUP/data" .
    fi
    
    if [[ -f "backups/$LATEST_BACKUP/.env" ]]; then
        cp "backups/$LATEST_BACKUP/.env" .
    fi
    
    log_success "Rollback completed"
}

setup_ssl() {
    if [[ "$SETUP_SSL" == "true" ]]; then
        log_info "Setting up SSL certificates..."
        
        # Create SSL directory
        mkdir -p ssl
        
        # Generate self-signed certificate (for development)
        if [[ "$ENVIRONMENT" == "development" ]]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/server.key \
                -out ssl/server.crt \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            
            log_success "Self-signed SSL certificate created"
        else
            log_warning "For production, please configure proper SSL certificates"
            log_info "Consider using Let's Encrypt or your certificate authority"
        fi
    fi
}

# Parse arguments
ENVIRONMENT="${1:-$DEFAULT_ENV}"
USE_DOCKER=false
USE_PM2=false
UPDATE_DEPLOYMENT=false
INCLUDE_MONITORING=false
SETUP_SSL=false
CREATE_BACKUP=false
ROLLBACK_DEPLOYMENT=false
SHOW_STATUS=false
SHOW_LOGS=false

# Parse options
for arg in "$@"; do
    case $arg in
        --docker)
            USE_DOCKER=true
            ;;
        --pm2)
            USE_PM2=true
            ;;
        --update)
            UPDATE_DEPLOYMENT=true
            ;;
        --monitoring)
            INCLUDE_MONITORING=true
            ;;
        --ssl)
            SETUP_SSL=true
            ;;
        --backup)
            CREATE_BACKUP=true
            ;;
        --rollback)
            ROLLBACK_DEPLOYMENT=true
            ;;
        --status)
            SHOW_STATUS=true
            ;;
        --logs)
            SHOW_LOGS=true
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
    esac
done

# Normalize environment
case $ENVIRONMENT in
    dev|development)
        ENVIRONMENT="development"
        ;;
    staging)
        ENVIRONMENT="staging"
        ;;
    prod|production)
        ENVIRONMENT="production"
        ;;
    --*)
        # First argument is an option, use default environment
        ENVIRONMENT="$DEFAULT_ENV"
        ;;
esac

# Handle special commands
if [[ "$SHOW_STATUS" == "true" ]]; then
    show_status
    exit 0
fi

if [[ "$SHOW_LOGS" == "true" ]]; then
    show_logs
    exit 0
fi

if [[ "$ROLLBACK_DEPLOYMENT" == "true" ]]; then
    rollback_deployment
    exit 0
fi

# Set default deployment method if none specified
if [[ "$USE_DOCKER" == "false" && "$USE_PM2" == "false" ]]; then
    USE_PM2=true
    log_info "No deployment method specified, using PM2 as default"
fi

# Main deployment flow
log_info "🚀 Starting YouTube Bot deployment"
log_info "Environment: $ENVIRONMENT"
log_info "Deployment method: $([ "$USE_DOCKER" == "true" ] && echo "Docker" || echo "PM2")"

# Change to script directory
cd "$SCRIPT_DIR"

# Run deployment steps
check_requirements
setup_environment
create_backup
setup_ssl

if [[ "$USE_DOCKER" == "true" ]]; then
    deploy_docker
elif [[ "$USE_PM2" == "true" ]]; then
    deploy_pm2
fi

log_success "🎉 Deployment completed successfully!"
log_info "Access your application at: http://localhost:3000"

if [[ "$INCLUDE_MONITORING" == "true" ]]; then
    log_info "Monitoring dashboard: http://localhost:3001 (Grafana)"
    log_info "Prometheus metrics: http://localhost:9090"
fi

# Show final status
echo ""
show_status
