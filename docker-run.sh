#!/bin/bash

# ShareNear Docker Runner Script

echo "🚀 ShareNear Docker Runner"
echo "=========================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [dev|prod|build|stop|logs|clean]"
    echo ""
    echo "Commands:"
    echo "  dev     - Run development server with hot reload"
    echo "  prod    - Run production build"
    echo "  build   - Build Docker images"
    echo "  stop    - Stop all containers"
    echo "  logs    - Show container logs"
    echo "  clean   - Remove containers and images"
    echo ""
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Development mode
run_dev() {
    echo "🔧 Starting development server..."
    echo "📍 Application will be available at: http://localhost:3001"
    docker compose up --build sharenear-dev
}

# Production mode
run_prod() {
    echo "🏭 Starting production server..."
    echo "📍 Application will be available at: http://localhost:3003"
    docker compose --profile production up --build sharenear-prod
}

# Build images
build_images() {
    echo "🔨 Building Docker images..."
    docker compose build
}

# Stop containers
stop_containers() {
    echo "🛑 Stopping containers..."
    docker compose down
}

# Show logs
show_logs() {
    echo "📋 Showing container logs..."
    docker compose logs -f
}

# Clean up
clean_up() {
    echo "🧹 Cleaning up containers and images..."
    docker compose down --rmi all --volumes --remove-orphans
    docker system prune -f
}

# Main script logic
check_docker

case "${1:-dev}" in
    "dev")
        run_dev
        ;;
    "prod")
        run_prod
        ;;
    "build")
        build_images
        ;;
    "stop")
        stop_containers
        ;;
    "logs")
        show_logs
        ;;
    "clean")
        clean_up
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_usage
        exit 1
        ;;
esac