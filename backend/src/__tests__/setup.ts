import dotenv from 'dotenv';
import { db } from '../config/database';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Global test setup
beforeAll(async () => {
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in test environment');
  }

  // For unit tests that don't need the database, skip migrations
  const needsDatabase = process.env.SKIP_DB_SETUP !== 'true';

  if (needsDatabase) {
    // Run migrations for test database, but gracefully handle PostGIS issues
    try {
      await db.migrate.latest();
      console.log('✅ Test database migrations completed');
    } catch (error) {
      console.warn('⚠️ Migration failed, setting up minimal schema for tests:', (error as Error).message);
      try {
        // Basic setup for auth tests
        await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await db.raw(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            company VARCHAR(255),
            role VARCHAR(20) NOT NULL DEFAULT 'operator',
            email_verified BOOLEAN DEFAULT false,
            verification_token VARCHAR(255),
            verification_token_expires TIMESTAMP,
            reset_password_token VARCHAR(255),
            reset_password_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Basic test schema setup completed');
      } catch (basicError) {
        console.error('❌ Basic test setup failed:', basicError);
        // For pure unit tests like auth middleware, we can continue without DB
        if (process.env.TEST_TYPE === 'unit') {
          console.log('🏃‍♂️ Running unit tests without database');
        } else {
          throw basicError;
        }
      }
    }
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear test data but keep schema
  const tables = ['payment_history', 'pool_accounts', 'route_listings', 'routes', 'users'];
  for (const table of tables) {
    try {
      await db(table).del();
    } catch (error) {
      // Table might not exist, continue
    }
  }
});

// Global test teardown
afterAll(async () => {
  await db.destroy();
});