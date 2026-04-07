#!/bin/bash

# Database Reset Script for PoolRoute OS
# Safely resets the database with fresh migrations and demo data

set -e

echo "🗄️  PoolRoute OS Database Reset"
echo "============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check database connection
check_database() {
    echo "🔍 Checking database connection..."

    if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "❌ ${RED}PostgreSQL is not running${NC}"
        echo "💡 Start PostgreSQL and try again"
        exit 1
    fi

    echo -e "✅ ${GREEN}PostgreSQL is running${NC}"
}

# Function to backup existing data (optional)
backup_data() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"

    echo "💾 Creating backup: $backup_file"

    if pg_dump -h localhost -U poolroute poolroute_dev > "$backup_file" 2>/dev/null; then
        echo -e "✅ ${GREEN}Backup created: $backup_file${NC}"
        return 0
    else
        echo -e "⚠️  ${YELLOW}Backup failed - continuing without backup${NC}"
        return 1
    fi
}

# Function to reset main database
reset_main_db() {
    echo "🔄 Resetting main database (poolroute_dev)..."

    # Check if database exists
    if psql -h localhost -U poolroute -d postgres -c "SELECT 1 FROM pg_database WHERE datname='poolroute_dev'" | grep -q 1; then
        echo "📋 Database exists - clearing data..."

        # Clear all tables but keep schema
        cd backend
        npm run db:rollback || true
        npm run db:migrate
        cd ..
    else
        echo "🆕 Creating new database..."
        psql -h localhost -U poolroute -d postgres -c "CREATE DATABASE poolroute_dev OWNER poolroute;"

        # Add PostGIS extension
        psql -h localhost -U poolroute -d poolroute_dev -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

        # Run migrations
        cd backend
        npm run db:migrate
        cd ..
    fi

    echo -e "✅ ${GREEN}Main database reset complete${NC}"
}

# Function to reset test database
reset_test_db() {
    echo "🧪 Resetting test database (poolroute_test)..."

    # Drop and recreate test database
    psql -h localhost -U poolroute -d postgres -c "DROP DATABASE IF EXISTS poolroute_test;" || true
    psql -h localhost -U poolroute -d postgres -c "CREATE DATABASE poolroute_test OWNER poolroute;"

    # Add extensions
    psql -h localhost -U poolroute -d poolroute_test -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

    echo -e "✅ ${GREEN}Test database reset complete${NC}"
}

# Function to seed demo data
seed_demo_data() {
    echo "🌱 Seeding demo data..."

    cd backend

    if npm run seed; then
        echo -e "✅ ${GREEN}Demo data seeded successfully${NC}"
    else
        echo -e "❌ ${RED}Failed to seed demo data${NC}"
        exit 1
    fi

    cd ..
}

# Function to verify database state
verify_database() {
    echo "🔍 Verifying database state..."

    # Check if we can connect and count users
    local user_count=$(psql -h localhost -U poolroute -d poolroute_dev -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")

    if [ "$user_count" -gt 0 ]; then
        echo -e "✅ ${GREEN}Database verified: $user_count users found${NC}"
    else
        echo -e "⚠️  ${YELLOW}Database may be empty${NC}"
    fi

    # Show demo credentials
    echo ""
    echo "🔑 Demo login credentials:"
    echo "  Email:    admin@poolroute.com"
    echo "  Password: password123"
    echo ""
    echo "👥 Other demo accounts:"
    echo "  john.smith@example.com (operator)"
    echo "  sarah.johnson@example.com (operator)"
    echo "  mike.wilson@example.com (seller)"
    echo "  lisa.brown@example.com (buyer)"
    echo "  All passwords: password123"
}

# Main function
main() {
    local create_backup=false
    local reset_test=true
    local skip_seed=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup)
                create_backup=true
                shift
                ;;
            --no-test)
                reset_test=false
                shift
                ;;
            --no-seed)
                skip_seed=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --backup     Create backup before reset"
                echo "  --no-test    Skip test database reset"
                echo "  --no-seed    Skip demo data seeding"
                echo "  --help       Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Load environment variables
    if [ -f ".env" ]; then
        source .env
    else
        echo -e "⚠️  ${YELLOW}.env file not found${NC}"
    fi

    # Check prerequisites
    check_database

    # Create backup if requested
    if [ "$create_backup" = true ]; then
        backup_data
        echo ""
    fi

    # Reset databases
    reset_main_db
    echo ""

    if [ "$reset_test" = true ]; then
        reset_test_db
        echo ""
    fi

    # Seed demo data
    if [ "$skip_seed" = false ]; then
        seed_demo_data
        echo ""
    fi

    # Verify everything worked
    verify_database

    echo -e "🎉 ${GREEN}Database reset complete!${NC}"
}

# Run the main function
main "$@"