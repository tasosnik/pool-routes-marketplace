#!/bin/bash

# PoolRoute OS Development Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 PoolRoute OS Development Setup"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your Mapbox token before continuing."
    echo "   Get a free token at: https://account.mapbox.com/access-tokens/"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U poolroute -d poolroute_dev > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Run migrations and seed data
echo "🗄️ Setting up database..."
npm run db:migrate
npm run seed

# Go back to root
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Make sure you've added your Mapbox token to .env"
echo "  2. Start the development servers:"
echo "     npm run dev"
echo ""
echo "📍 Application URLs:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:3001"
echo "  • Health Check: http://localhost:3001/health"
echo ""
echo "🔐 Demo Login Credentials (password: password123):"
echo "  • admin@poolroute.com (Admin)"
echo "  • john.smith@example.com (Operator)"
echo "  • sarah.johnson@example.com (Operator)"
echo "  • mike.wilson@example.com (Seller)"
echo "  • lisa.brown@example.com (Buyer)"
echo ""