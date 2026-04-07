# Test Data Directory

This directory contains realistic test data for the PoolRoute OS application, organized by user and purpose.

## Directory Structure

```
test-data/
├── users/                  # User-specific test data
│   ├── john-smith/         # Operator 1 - Beverly Hills route
│   ├── sarah-johnson/      # Operator 2 - Santa Monica route
│   ├── mike-wilson/        # Seller - Pasadena route
│   └── lisa-brown/         # Buyer - No routes
├── sample-imports/         # Generic import templates
│   └── invalid-samples/    # Error testing files
├── schemas/                # Data schemas
└── scripts/                # Data management scripts
```

## Test Users

All test users use password: `password123`

| User | Email | Role | Company | Test Data |
|------|-------|------|---------|-----------|
| John Smith | john.smith@example.com | Operator | Crystal Clear Pool Service | Beverly Hills route (25 accounts) |
| Sarah Johnson | sarah.johnson@example.com | Operator | Blue Wave Pool Care | Santa Monica route (30 accounts) |
| Mike Wilson | mike.wilson@example.com | Seller | Sunset Pool Services | Pasadena route (20 accounts, for sale) |
| Lisa Brown | lisa.brown@example.com | Buyer | AquaPro Pool Solutions | No routes (potential buyer) |

## CSV Format

The standard CSV format for importing pool accounts:

```csv
customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
```

### Field Descriptions

- **customer_name**: Full name of the customer (required)
- **street**: Street address (required)
- **city**: City name (required)
- **state**: 2-letter state code (required)
- **zip**: 5-digit ZIP code (required)
- **email**: Customer email (optional)
- **phone**: Phone number in format XXX-XXX-XXXX (optional)
- **service_type**: weekly, biweekly, monthly, onetime (default: weekly)
- **frequency**: weekly, biweekly, monthly (default: weekly)
- **monthly_rate**: Monthly service rate in dollars (required)
- **pool_type**: chlorine, saltwater, natural (default: chlorine)
- **pool_size**: small, medium, large, xlarge (optional)
- **notes**: Special instructions or notes (optional)

## Usage

### Loading Test Data

```bash
# Reset database with test data
npm run seed

# Or from backend directory
cd backend && npm run seed
```

### Testing CSV Import

Use files from `sample-imports/` for testing different scenarios:
- `basic-route.csv`: Simple 10-account route
- `large-route.csv`: 100+ accounts for performance testing
- `multi-route.csv`: Multiple routes in one file
- `invalid-samples/`: Various error conditions

### Generating New Test Data

```bash
# Generate new test data
npm run test-data:generate

# Validate CSV files
npm run test-data:validate
```

## Data Characteristics

### Geographic Distribution
- **Beverly Hills**: High-end residential, $200-400/month rates
- **Santa Monica**: Beach area mixed residential, $150-300/month rates
- **Pasadena**: Suburban residential, $100-250/month rates

### Service Patterns
- 70% weekly service
- 20% bi-weekly service
- 10% monthly service

### Pool Types
- 60% chlorine
- 35% saltwater
- 5% natural

### Customer Retention
- 95% active accounts
- 3% suspended (vacation/seasonal)
- 2% inactive (pending reactivation)

## Testing Scenarios

1. **Happy Path**: Import clean CSV with valid data
2. **Duplicate Detection**: Import file with existing customers
3. **Invalid Data**: Missing required fields, invalid formats
4. **Large Files**: Performance testing with 1000+ records
5. **Encoding Issues**: UTF-8, ISO-8859-1, Windows-1252
6. **Special Characters**: Names with accents, addresses with suites
7. **Concurrent Imports**: Multiple users importing simultaneously