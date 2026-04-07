#!/bin/bash

# PoolRoute OS Development Reset Script
# Cleans up stale processes, resets database, and restarts services

set -e

echo "🔄 PoolRoute OS Development Reset"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service_name=$2

    echo "🔪 Killing processes on port $port ($service_name)..."

    # Find and kill processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo $pids | xargs kill -9
        echo -e "✅ ${GREEN}Killed $service_name processes${NC}"
    else
        echo -e "ℹ️  ${BLUE}No $service_name processes found${NC}"
    fi
}

# Function to clean up node modules and reinstall
clean_install() {
    echo "📦 Cleaning and reinstalling dependencies..."

    # Clean root node_modules
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        echo -e "✅ ${GREEN}Cleaned root node_modules${NC}"
    fi

    # Clean frontend node_modules
    if [ -d "frontend/node_modules" ]; then
        rm -rf frontend/node_modules
        echo -e "✅ ${GREEN}Cleaned frontend node_modules${NC}"
    fi

    # Clean backend node_modules
    if [ -d "backend/node_modules" ]; then
        rm -rf backend/node_modules
        echo -e "✅ ${GREEN}Cleaned backend node_modules${NC}"
    fi

    # Install dependencies
    echo "📥 Installing dependencies..."
    npm install
    echo -e "✅ ${GREEN}Dependencies installed${NC}"
}

# Function to reset database
reset_database() {
    echo "🗄️  Resetting database..."

    # Load environment variables
    if [ -f ".env" ]; then
        source .env
    fi

    # Drop and recreate test database
    if psql -h localhost -U poolroute -c "DROP DATABASE IF EXISTS poolroute_test;" postgres > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}Dropped test database${NC}"
    fi

    if psql -h localhost -U poolroute -c "CREATE DATABASE poolroute_test OWNER poolroute;" postgres > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}Created test database${NC}"
    fi

    # Reset main database
    echo "🔄 Resetting main database..."
    cd backend

    # Run fresh migrations
    if npm run db:migrate > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}Migrations completed${NC}"
    else
        echo -e "⚠️  ${YELLOW}Migration issues - continuing...${NC}"
    fi

    # Seed with demo data
    if npm run seed > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}Demo data seeded${NC}"
    else
        echo -e "⚠️  ${YELLOW}Seeding issues - continuing...${NC}"
    fi

    cd ..
}

# Function to start development servers
start_services() {
    echo "🚀 Starting development services..."

    # Start in background
    nohup npm run dev > dev.log 2>&1 &

    echo -e "✅ ${GREEN}Development servers starting${NC}"
    echo "📝 Check dev.log for output"

    # Give services time to start
    sleep 3

    # Check if services are responding
    local attempts=0
    local max_attempts=10

    echo "⏳ Waiting for services to be ready..."

    while [ $attempts -lt $max_attempts ]; do
        if curl -f -s http://localhost:3001/health > /dev/null 2>&1 && \
           curl -f -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "✅ ${GREEN}All services are ready!${NC}"
            return 0
        fi

        attempts=$((attempts + 1))
        echo "⏳ Waiting... ($attempts/$max_attempts)"
        sleep 2
    done

    echo -e "⚠️  ${YELLOW}Services may still be starting. Check dev.log${NC}"
}

# Main reset function
main() {
    # Parse command line arguments
    local clean_deps=false
    local reset_db=true
    local start_after=true

    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean-deps)
                clean_deps=true
                shift
                ;;
            --no-db-reset)
                reset_db=false
                shift
                ;;
            --no-start)
                start_after=false
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --clean-deps     Clean and reinstall node_modules"
                echo "  --no-db-reset    Skip database reset"
                echo "  --no-start       Don't start services after reset"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    echo "🧹 Stopping existing processes..."
    echo ""

    # Kill existing processes
    kill_port 3000 "Frontend"
    kill_port 3001 "Backend"
    echo ""

    # Clean install if requested
    if [ "$clean_deps" = true ]; then
        clean_install
        echo ""
    fi

    # Reset database if requested
    if [ "$reset_db" = true ]; then
        reset_database
        echo ""
    fi

    # Start services if requested
    if [ "$start_after" = true ]; then
        start_services
        echo ""
    fi

    echo -e "🎉 ${GREEN}Reset complete!${NC}"

    if [ "$start_after" = true ]; then
        echo ""
        echo "🌐 Services available at:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:3001"
        echo ""
        echo "📊 Demo login credentials:"
        echo "   Email:    admin@poolroute.com"
        echo "   Password: password123"
    fi
}

# Run the main function
main "$@"