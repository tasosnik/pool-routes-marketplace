# PoolRoute OS Import System Documentation

## Overview

The PoolRoute OS Import System provides a robust, scalable solution for importing pool service account data from CSV files (with future PDF support planned). The system includes comprehensive validation, deduplication, and data integrity protection.

## Architecture

### Directory Structure

```
backend/src/services/import/
├── ImportService.ts          # Main orchestrator
├── parsers/
│   └── CSVParser.ts          # CSV parsing and normalization
├── validators/
│   └── DuplicateChecker.ts   # Duplicate detection and handling
└── types/
    └── import.types.ts       # TypeScript interfaces

test-data/
├── users/                    # User-specific test data
├── sample-imports/           # Import templates
├── schemas/                  # Validation schemas
└── scripts/                  # Data generation tools
```

## Features

### 1. CSV Import

#### Supported Format
```csv
customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
```

#### Column Flexibility
The parser automatically detects common variations:
- `customer_name` → customer, name, client_name, client
- `street` → address, street_address, address1
- `monthly_rate` → rate, price, monthly_price, amount

#### Encoding Support
- UTF-8 (with/without BOM)
- ISO-8859-1
- Windows-1252
- Auto-detection via chardet

### 2. Validation

#### Required Fields
- customer_name
- street
- city
- state (2-letter code)
- zip (5 or 9 digits)
- monthly_rate (positive number)

#### Business Rules
- Monthly rates between $50-$1000 (warnings outside range)
- Valid email format
- Phone number normalization to XXX-XXX-XXXX
- State limited to California (configurable)

### 3. Duplicate Detection

#### Detection Strategies
1. **Exact Match**: Same address components
2. **Phone Match**: Same phone number (90% confidence)
3. **Fuzzy Match**: Similar name + address (Levenshtein distance)
4. **Address Match**: Same address, different name variation

#### Handling Options
- **SKIP**: Don't import duplicate (default)
- **UPDATE**: Update existing record
- **CREATE_NEW**: Create anyway
- **FAIL**: Stop import on duplicate

### 4. Data Integrity

#### Database Constraints
- Composite unique index: (route_id, customer_name, street, city, state, zip)
- Phone and email indexes for fast lookup
- Foreign key cascades for consistency

#### Transaction Safety
- All imports wrapped in database transactions
- Automatic rollback on failure
- Import logs for audit trail

#### Import States
```
PENDING → VALIDATING → PROCESSING → SAVING → COMPLETED
           ↓             ↓           ↓
        FAILED      FAILED      PARTIAL_SUCCESS
```

## API Endpoints

### POST /api/import/csv/validate
Validate CSV without importing
```javascript
const formData = new FormData();
formData.append('file', csvFile);

fetch('/api/import/csv/validate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### POST /api/import/csv/preview
Parse and preview first 10 rows
```javascript
// Response includes:
{
  success: true,
  data: {
    totalRows: 100,
    previewAccounts: [...],
    errors: [],
    warnings: []
  }
}
```

### POST /api/import/csv/execute
Import data to database
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('routeId', 'existing-route-id'); // Optional
formData.append('routeName', 'New Route Name');   // If creating new
formData.append('duplicateStrategy', 'skip');

// Response:
{
  success: true,
  data: {
    importId: "...",
    status: "completed",
    processedRecords: 100,
    createdAccounts: 95,
    updatedAccounts: 0,
    skippedAccounts: 5,
    routeId: "...",
    errors: [],
    warnings: [...]
  }
}
```

### GET /api/import/templates
Get available sample templates

### GET /api/import/templates/download/:filename
Download specific template

### GET /api/import/history
Get import history for current user

## Test Data

### User-Specific Data

Each demo user has realistic test data:

| User | Route | Accounts | Revenue | Characteristics |
|------|-------|----------|---------|-----------------|
| john.smith@example.com | Beverly Hills | 25 | $8,375/mo | High-end residential |
| sarah.johnson@example.com | Santa Monica | 30 | $7,975/mo | Beach area, HOAs |
| mike.wilson@example.com | Pasadena | 20 | $4,200/mo | For sale listing |

### Sample Files

#### Valid Samples
- `basic-route.csv`: 10 accounts for testing
- `large-route.csv`: 100+ accounts for performance
- `multi-route.csv`: Multiple routes (future feature)

#### Invalid Samples
- `missing-fields.csv`: Test validation
- `duplicate-accounts.csv`: Test deduplication

## Usage Examples

### Frontend Integration
```typescript
import importService from './services/importService';

// Validate before import
const validation = await importService.validateCSV(file);
if (!validation.success) {
  // Show errors to user
  console.error(validation.data.errors);
}

// Import with options
const result = await importService.importCSV(file, {
  routeId: existingRouteId,
  duplicateStrategy: DuplicateStrategy.SKIP
});

// Handle results
if (result.success) {
  console.log(`Created: ${result.data.createdAccounts}`);
  console.log(`Skipped: ${result.data.skippedAccounts}`);
}
```

### Testing Import
```bash
# Generate test data
cd test-data/scripts
npx ts-node generate-test-data.ts

# Validate CSV files
npx ts-node validate-imports.ts ../sample-imports/

# Run import tests
cd backend
npm test import.test.ts
```

## Error Handling

### Error Codes
- `EMPTY_FILE`: No data in CSV
- `MISSING_COLUMNS`: Required columns not found
- `PARSE_ERROR`: CSV parsing failed
- `REQUIRED_FIELD`: Missing required value
- `INVALID_VALUE`: Value outside valid range
- `INVALID_FORMAT`: Email/phone format error
- `DUPLICATE_ADDRESS`: Duplicate detected
- `IMPORT_ERROR`: Row processing failed

### Error Response Format
```javascript
{
  row: 5,
  field: "monthly_rate",
  value: "abc",
  message: "Invalid monthly rate value",
  code: "INVALID_VALUE"
}
```

## Future PDF Support

### Planned Architecture
```typescript
interface IPDFParser extends IParser {
  extractTables(buffer: Buffer): Promise<Table[]>;
  performOCR(buffer: Buffer): Promise<string>;
  detectSchema(tables: Table[]): SchemaMapping;
}
```

### Integration Points
1. Parser interface already defined
2. Normalizers are format-agnostic
3. Same validation pipeline
4. Import service accepts any IParser

### Challenges to Address
- Table extraction accuracy
- OCR for scanned documents
- Schema auto-detection
- Multi-page handling

## Performance Considerations

### Limits
- Max file size: 10MB
- Max rows: 10,000 per import
- Batch processing: 100 records per transaction

### Optimization
- Stream parsing for large files
- Database connection pooling
- Indexed columns for fast lookups
- Lazy validation (fail fast)

## Security

### Authentication
- JWT token required for all import endpoints
- User can only import to their own routes
- Role-based access (operator, admin)

### Validation
- File type validation (MIME type check)
- Size limits enforced
- SQL injection prevention via parameterized queries
- XSS protection in error messages

### Data Privacy
- No sensitive data in logs
- Import history linked to user
- Automatic cleanup of old import logs (configurable)

## Troubleshooting

### Common Issues

#### "Missing required columns"
- Check CSV headers match expected format
- Use column mapping in preview mode
- Download template for reference

#### "Duplicate account skipped"
- Review duplicate strategy setting
- Check existing accounts in route
- Use UPDATE strategy if appropriate

#### "Invalid monthly rate"
- Ensure numeric values (no currency symbols)
- Check for negative values
- Verify decimal separator (. not ,)

#### "File too large"
- Split into multiple files
- Remove unnecessary columns
- Compress if transferring

## Testing

### Unit Tests
```bash
npm test import.test.ts
```

### Integration Tests
```bash
# Start test database
npm run test:db:start

# Run integration tests
npm run test:integration

# Cleanup
npm run test:db:stop
```

### Manual Testing
1. Login as demo user
2. Navigate to Import page
3. Download sample template
4. Modify and upload
5. Verify in Routes page

## Maintenance

### Database
```sql
-- Check import logs
SELECT * FROM import_logs
WHERE user_id = ?
ORDER BY started_at DESC;

-- Clean old logs
DELETE FROM import_logs
WHERE completed_at < NOW() - INTERVAL '30 days';

-- Check for orphaned accounts
SELECT * FROM pool_accounts
WHERE route_id NOT IN (SELECT id FROM routes);
```

### Monitoring
- Track import success rate
- Monitor average processing time
- Alert on high error rates
- Log unusual patterns (e.g., massive imports)

## API Rate Limits

- Validation: 100 requests per 15 minutes
- Preview: 50 requests per 15 minutes
- Execute: 20 imports per hour
- Templates: Unlimited

---

*Last updated: March 2024*
*Version: 1.0.0*