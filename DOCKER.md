# 🐳 Docker Setup for ShareNear

This guide explains how to run ShareNear using Docker for both development and production environments.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## 🚀 Quick Start

### Option 1: Using the Helper Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x docker-run.sh

# Run development server
./docker-run.sh dev

# Run production server
./docker-run.sh prod

# View all available commands
./docker-run.sh help
```

### Option 2: Using Docker Compose Directly

```bash
# Development mode (with hot reload)
docker-compose up --build sharenear-dev

# Production mode
docker-compose --profile production up --build sharenear-prod
```

### Option 3: Using Docker Commands Directly

```bash
# Development
docker build -f Dockerfile.dev -t sharenear:dev .
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules sharenear:dev

# Production
docker build -f Dockerfile -t sharenear:prod .
docker run -p 3000:3000 sharenear:prod
```

## 🌐 Access Points

- **Development**: http://localhost:3000
- **Production**: http://localhost:3001 (when using docker-compose)

## 📁 Docker Files Overview

### `Dockerfile` (Production)
- Multi-stage build for optimized production image
- Builds the Next.js application
- Removes dev dependencies for smaller image size
- Runs on port 3000

### `Dockerfile.dev` (Development)
- Development-optimized image
- Includes all dependencies
- Supports hot reload with volume mounting
- Faster startup time

### `docker-compose.yml`
- Orchestrates both development and production services
- Handles networking and volume mounting
- Separates dev and prod profiles

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `./docker-run.sh dev` | Start development server with hot reload |
| `./docker-run.sh prod` | Start production server |
| `./docker-run.sh build` | Build Docker images |
| `./docker-run.sh stop` | Stop all containers |
| `./docker-run.sh logs` | View container logs |
| `./docker-run.sh clean` | Remove containers and images |

## 🔧 Development Features

- **Hot Reload**: Code changes are automatically reflected
- **Volume Mounting**: Local files are synced with container
- **Port Mapping**: Access the app at localhost:3000
- **Environment Variables**: Development environment configured

## 🏭 Production Features

- **Optimized Build**: Minified and optimized for production
- **Smaller Image**: Dev dependencies removed after build
- **Performance**: Better startup time and memory usage
- **Security**: Production-ready configuration

## 📊 Container Management

### View Running Containers
```bash
docker ps
```

### View Container Logs
```bash
# All logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service logs
docker-compose logs sharenear-dev
```

### Stop Containers
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Rebuild Containers
```bash
# Rebuild and start
docker-compose up --build

# Force rebuild (no cache)
docker-compose build --no-cache
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
docker run -p 3001:3000 sharenear:dev
```

### Container Won't Start
```bash
# Check Docker daemon
docker info

# View detailed logs
docker-compose logs --details

# Rebuild without cache
docker-compose build --no-cache
```

### Permission Issues (Linux/macOS)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Make script executable
chmod +x docker-run.sh
```

### Clean Up Everything
```bash
# Remove all containers, images, and volumes
./docker-run.sh clean

# Or manually
docker system prune -a --volumes
```

## 🔒 Environment Variables

Create a `.env.local` file for environment-specific variables:

```env
# .env.local
NODE_ENV=development
PORT=3000
# Add your custom variables here
```

## 📈 Performance Tips

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Multi-stage builds**: Keep production images small
3. **Layer caching**: Order Dockerfile commands for better caching
4. **Volume mounting**: Use for development hot reload

## 🌍 Network Configuration

The docker-compose setup creates a custom network `sharenear-network` for service communication. This allows:

- Service discovery between containers
- Isolated network environment
- Better security and performance

## 📱 Mobile Testing

To test on mobile devices in the same network:

1. Find your computer's IP address:
   ```bash
   # Linux/macOS
   ip addr show | grep inet
   
   # Or
   ifconfig | grep inet
   ```

2. Access the app at: `http://YOUR_IP:3000`

## 🚀 Deployment Ready

The production Docker setup is ready for deployment to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes clusters
- Any Docker-compatible hosting

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. View container logs: `./docker-run.sh logs`
3. Ensure Docker is running and updated
4. Try cleaning up and rebuilding: `./docker-run.sh clean`