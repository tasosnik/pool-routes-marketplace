#!/bin/bash

# PoolRoute OS Health Check Script
# Checks if all services are running and healthy

set -e

echo "🏥 PoolRoute OS Health Check"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if a URL is accessible
check_url() {
    local url=$1
    local service_name=$2

    if curl -f -s "$url" > /dev/null; then
        echo -e "✅ ${GREEN}$service_name${NC} is healthy"
        return 0
    else
        echo -e "❌ ${RED}$service_name${NC} is not responding"
        return 1
    fi
}

# Function to check if a process is running
check_process() {
    local port=$1
    local service_name=$2

    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}$service_name${NC} is running on port $port"
        return 0
    else
        echo -e "❌ ${RED}$service_name${NC} is not running on port $port"
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo "🗄️  Checking database connection..."

    # Check if PostgreSQL is running
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}PostgreSQL${NC} is running"

        # Check if our database exists
        if psql -h localhost -U poolroute -d poolroute_dev -c "SELECT 1" > /dev/null 2>&1; then
            echo -e "✅ ${GREEN}PoolRoute database${NC} is accessible"
            return 0
        else
            echo -e "❌ ${RED}PoolRoute database${NC} is not accessible"
            return 1
        fi
    else
        echo -e "❌ ${RED}PostgreSQL${NC} is not running"
        return 1
    fi
}

# Function to check environment variables
check_env() {
    echo "🔧 Checking environment configuration..."

    local missing_vars=()

    if [ -z "$JWT_SECRET" ]; then
        missing_vars+=("JWT_SECRET")
    fi

    if [ -z "$DATABASE_URL" ]; then
        missing_vars+=("DATABASE_URL")
    fi

    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "✅ ${GREEN}Environment variables${NC} are configured"
        return 0
    else
        echo -e "❌ ${RED}Missing environment variables:${NC} ${missing_vars[*]}"
        return 1
    fi
}

# Main health check
main() {
    local exit_code=0

    # Load environment variables
    if [ -f ".env" ]; then
        source .env
    fi

    echo "📋 Running health checks..."
    echo ""

    # Check environment
    check_env || exit_code=1
    echo ""

    # Check database
    check_database || exit_code=1
    echo ""

    # Check services
    echo "🌐 Checking web services..."
    check_process 3001 "Backend API" || exit_code=1
    check_process 3000 "Frontend App" || exit_code=1
    echo ""

    # Check API health endpoint
    echo "🔍 Checking API health..."
    check_url "http://localhost:3001/health" "Backend Health" || exit_code=1
    echo ""

    # Check frontend is serving
    echo "🌍 Checking frontend..."
    check_url "http://localhost:3000" "Frontend" || exit_code=1
    echo ""

    # Summary
    if [ $exit_code -eq 0 ]; then
        echo -e "🎉 ${GREEN}All systems healthy!${NC}"
    else
        echo -e "⚠️  ${YELLOW}Some issues detected.${NC} Check the output above."
    fi

    return $exit_code
}

# Run the health check
main "$@"