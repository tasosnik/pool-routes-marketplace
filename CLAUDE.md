# CLAUDE.md - PoolRoute OS Development Guide

## Project Overview

PoolRoute OS is a full-stack TypeScript application for pool service route management and marketplace. This is a **monorepo** with separate frontend (React) and backend (Express) applications that share type definitions.

**Core Purpose**: Enable pool service operators to manage routes, evaluate acquisitions, and buy/sell routes through a mobile-friendly platform.

## Essential Commands

### Development
```bash
# Start both frontend (3000) and backend (3001) in development mode
npm run dev

# Start individual services
npm run dev:frontend  # React app on port 3000
npm run dev:backend   # Express API on port 3001
```

### Database Operations
```bash
# Run migrations (from backend/ directory)
cd backend && npm run db:migrate

# Seed database with demo data
cd backend && npm run seed
# OR from root: npm run seed
```

### Build and Test
```bash
# Build entire project for production
npm run build

# Run linting across all packages
npm run lint

# Run tests across all packages
npm run test
```

## Architecture

### Monorepo Structure
- **Root**: Workspace manager with concurrently for parallel dev servers
- **frontend/**: React + TypeScript + Tailwind CSS + Vite
- **backend/**: Node.js + Express + TypeScript + PostgreSQL
- **shared/**: Originally intended for shared types (now using local type definitions)

### Key Technical Decisions

**Database**: PostgreSQL with text-based geospatial data (JSON coordinates) instead of PostGIS for compatibility. Uses Knex.js for migrations and query building.

**Authentication**: JWT tokens with bcrypt password hashing. Role-based access (admin, operator, seller, buyer).

**State Management**:
- Frontend: Zustand for client state, React Query for server state
- Backend: Express with TypeScript, Joi for validation

**Type Safety**: Local type definitions in both frontend and backend to avoid path mapping issues with shared types.

## Important Setup Requirements

### Environment Variables (.env in root)
```env
DATABASE_URL=postgresql://poolroute:development@localhost:5432/poolroute_dev
JWT_SECRET=poolroute-development-secret-key-change-in-production
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
PORT=3001
NODE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
```

### Database Setup
1. **PostgreSQL** must be running on localhost:5432
2. **UUID extension** required: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
3. **Database and user**:
   ```sql
   CREATE USER poolroute WITH PASSWORD 'development';
   CREATE DATABASE poolroute_dev OWNER poolroute;
   ```

### Demo Data
The seed file (`backend/src/seeds/001_demo_data.js`) contains realistic demo data:
- 5 users with different roles (password: "password123" for all)
- 3 pool routes in LA area (Beverly Hills, Santa Monica, Pasadena)
- Pool accounts with geospatial coordinates
- Payment history for analytics
- One marketplace listing

**Login credentials**:
- admin@poolroute.com (Admin)
- john.smith@example.com (Operator)
- sarah.johnson@example.com (Operator)
- mike.wilson@example.com (Seller)
- lisa.brown@example.com (Buyer)

## Known Issues & Workarounds

### TypeScript Build Issues
- **Problem**: @shared imports cause path resolution errors
- **Solution**: Local type definitions in `frontend/src/types/` and `backend/src/types/`
- **Files**: Both contain identical User, Route, PoolAccount, and API response types

### PostGIS Compatibility
- **Problem**: PostGIS extension may not be available in all environments
- **Solution**: Use text fields with JSON strings for coordinates instead of geometry types
- **Implementation**: All spatial data stored as JSON strings (e.g., `{"latitude": 34.0736, "longitude": -118.4004}`)

### Authentication Hash
- **Problem**: Incorrect bcrypt hash prevented demo user login
- **Solution**: Password hash in seed data is `$2a$12$h2XooFbTnDD52/8RCzb9HOtko2E3W9EtRSgd/DBtl21U3MuqHSIYK` (password123)
- **Verification**: Re-seed database if authentication fails

### JWT Type Errors
- **Problem**: TypeScript strict mode issues with jsonwebtoken library
- **Solution**: Type assertions in `backend/src/utils/jwt.ts` for token signing

## File Structure Notes

### Backend Key Files
- `src/index.ts`: Express server entry point
- `src/config/database.ts`: Knex configuration with connection pooling
- `src/migrations/`: Database schema definitions
- `src/seeds/001_demo_data.js`: Demo data for testing
- `src/routes/auth.ts`: Authentication endpoints
- `src/utils/jwt.ts`: JWT token utilities with type fixes

### Frontend Key Files
- `src/App.tsx`: Main routing and auth initialization
- `src/store/authStore.ts`: Zustand auth state management with persistence
- `src/services/authService.ts`: API service for authentication
- `src/types/index.ts`: Local type definitions (mirrors backend types)

### Shared Resources
- `.env`: Environment configuration for both frontend and backend
- `package.json`: Workspace configuration with parallel script execution

## Development Workflow

1. **Start Development**: `npm run dev` (starts both servers)
2. **Database Changes**: Create migration in `backend/src/migrations/`, run `npm run db:migrate`
3. **API Changes**: Update types in both `frontend/src/types/` and `backend/src/types/`
4. **Frontend Changes**: Hot reloading via Vite, API calls handled by React Query
5. **Testing**: Demo data available via seed script for consistent testing

## Production Considerations

- Set strong `JWT_SECRET` in production
- Use production PostgreSQL with proper connection pooling
- Mapbox token required for map functionality
- Build process: `npm run build` creates optimized bundles
- Database migrations run automatically in production deployment

---

*This file was generated to help future Claude instances understand the PoolRoute OS codebase structure and common development patterns.*