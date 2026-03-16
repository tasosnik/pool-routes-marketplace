# PoolRoute OS

A mobile-friendly marketplace and management platform for pool service routes, enabling operators to buy, sell, and optimize their service portfolios with unprecedented transparency and operational intelligence.

## 🎯 Core Value Proposition

Transform route acquisition from risky broker deals to data-driven portfolio optimization with full transparency, retention guarantees, and operational integration.

## 🚀 Primary User Outcomes (MVP)

1. **Route Portfolio Management**: Upload/import existing routes and visualize on map
2. **Acquisition Analysis**: Evaluate target routes and model portfolio impact

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + PostGIS (geospatial)
- **Maps**: Mapbox GL JS
- **Authentication**: JWT + bcrypt
- **File Processing**: Multer + csv-parser
- **Development**: Docker Compose for local stack

### Project Structure

```
poolroute-os/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route-based page components
│   │   ├── services/   # API service classes
│   │   ├── store/      # Zustand state management
│   │   ├── hooks/      # Custom React hooks
│   │   └── utils/      # Utility functions
├── backend/            # Express API server
│   ├── src/
│   │   ├── controllers/# Request handlers
│   │   ├── models/     # Database models
│   │   ├── routes/     # API route definitions
│   │   ├── middleware/ # Authentication & validation
│   │   ├── services/   # Business logic
│   │   └── utils/      # Helper functions
├── shared/             # Shared TypeScript types
└── docs/              # Documentation
```

## 🛠️ Prerequisites

Before running PoolRoute OS, ensure you have:

- **Node.js** 18+ and npm 9+
- **Docker** and **Docker Compose**
- **Git** for version control
- **Mapbox Account** (free tier available)

## ⚡ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd poolroute-os

# Copy environment template
cp .env.example .env

# Install root dependencies
npm install
```

### 2. Configure Environment

Edit `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://poolroute:development@localhost:5432/poolroute_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Mapbox Configuration (Required for mapping)
# Get free token at: https://account.mapbox.com/access-tokens/
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here

# API Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
```

### 3. Start with Docker (Recommended)

```bash
# Start all services (database, backend, frontend)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on port 5432

### 4. Manual Setup (Alternative)

If you prefer running without Docker:

```bash
# Start PostgreSQL with PostGIS (using Docker)
docker run -d \
  --name poolroute-db \
  -e POSTGRES_USER=poolroute \
  -e POSTGRES_PASSWORD=development \
  -e POSTGRES_DB=poolroute_dev \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Install and run backend
cd backend
npm install
npm run dev

# Install and run frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📋 Available Scripts

### Root Scripts
- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run docker:up` - Start Docker stack
- `npm run docker:down` - Stop Docker stack

### Backend Scripts
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run seed` - Seed database with demo data

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🗄️ Database Setup

The application uses PostgreSQL with PostGIS for geospatial features:

```bash
# Run migrations
cd backend
npm run db:migrate

# Seed with demo data (optional)
npm run seed
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Health Check
- `GET /health` - API health status

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
Ensure these are set in production:
- `DATABASE_URL` - Production PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT tokens
- `MAPBOX_ACCESS_TOKEN` - Mapbox API token
- `NODE_ENV=production`

## 🗺️ Roadmap

### ✅ MVP (Current)
- User authentication & account management
- Route/account data model & import (CSV, manual entry)
- Map visualization of current portfolio
- Target route evaluation & portfolio impact modeling
- Mobile-responsive UI with core workflows

### 🎯 V1 (Next)
- Route listing marketplace for sellers
- Enhanced filtering & search for buyers
- Basic escrow workflow (mocked)
- Route valuation model
- Payment history & retention analytics

### 🚀 V2+ (Future)
- Mobile technician workflow & scheduling
- Customer communication automation
- Advanced analytics & financial reporting
- Multi-industry expansion (landscaping, etc.)

## 🏛️ Architecture Decisions

### Database Design
- **PostgreSQL + PostGIS**: Robust geospatial support for route mapping
- **Migrations**: Version-controlled schema changes with Knex
- **Spatial Indexing**: Optimized for geographic queries

### Authentication
- **JWT Tokens**: Stateless authentication with refresh tokens
- **bcrypt**: Secure password hashing
- **Role-based Access**: Support for buyers, sellers, operators, admins

### Frontend State
- **Zustand**: Lightweight state management with persistence
- **React Query**: Server state management and caching
- **React Hook Form**: Performant form handling with validation

### API Design
- **RESTful**: Standard HTTP methods and status codes
- **TypeScript**: End-to-end type safety
- **Validation**: Joi schemas for request validation
- **Error Handling**: Consistent error response format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the API documentation at `/health` endpoint

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the pool service industry's need for transparency
- Designed for mobile-first operations

---

**PoolRoute OS** - Transforming pool route management one account at a time. 🏊‍♂️