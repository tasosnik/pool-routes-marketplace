#!/usr/bin/env node

/**
 * End-to-End Import Flow Test
 *
 * This script tests the complete CSV import flow from frontend to database
 * to ensure all components work together correctly.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const DB_URL = process.env.DATABASE_URL || 'postgresql://poolroute:development@localhost:5432/poolroute_dev';

// Test data
const TEST_USER = {
  email: 'admin@poolroute.com',
  password: 'password123'
};

const TEST_CSV = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
E2E Test Customer 1,123 E2E St,Los Angeles,CA,90001,e2e1@test.com,213-555-1001,weekly,weekly,200,chlorine,medium,E2E Test Note 1
E2E Test Customer 2,456 E2E Ave,Los Angeles,CA,90002,e2e2@test.com,213-555-1002,biweekly,biweekly,150,saltwater,large,E2E Test Note 2
E2E Test Customer 3,789 E2E Blvd,Los Angeles,CA,90003,e2e3@test.com,213-555-1003,weekly,weekly,250,chlorine,small,E2E Test Note 3`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[Step ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'yellow');
}

// Database client
let dbClient;

async function connectDatabase() {
  dbClient = new Client({ connectionString: DB_URL });
  await dbClient.connect();
}

async function cleanupTestData() {
  try {
    // Delete test accounts
    await dbClient.query(
      "DELETE FROM pool_accounts WHERE customer_name LIKE 'E2E Test Customer%'"
    );
    // Delete test routes
    await dbClient.query(
      "DELETE FROM routes WHERE name LIKE 'E2E Test%'"
    );
    logInfo('Cleaned up existing test data');
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

async function runE2ETest() {
  let token;
  let routeId;
  let importId;

  try {
    log('\n====== E2E Import Flow Test ======\n', 'bright');

    // Connect to database
    await connectDatabase();
    await cleanupTestData();

    // Step 1: Authentication
    logStep(1, 'Authenticating user');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    token = loginResponse.data.data.tokens.accessToken;
    logSuccess('Authentication successful');

    // Step 2: Validate CSV
    logStep(2, 'Validating CSV file');
    const validateForm = new FormData();
    validateForm.append('file', Buffer.from(TEST_CSV), 'test.csv');

    const validateResponse = await axios.post(
      `${API_URL}/api/import/csv/validate`,
      validateForm,
      {
        headers: {
          ...validateForm.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!validateResponse.data.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validateResponse.data.data.errors)}`);
    }

    logSuccess(`CSV validated successfully - ${validateResponse.data.data.totalRows} rows`);
    logInfo(`Errors: ${validateResponse.data.data.errors.length}, Warnings: ${validateResponse.data.data.warnings.length}`);

    // Step 3: Preview CSV
    logStep(3, 'Previewing CSV data');
    const previewForm = new FormData();
    previewForm.append('file', Buffer.from(TEST_CSV), 'test.csv');

    const previewResponse = await axios.post(
      `${API_URL}/api/import/csv/preview`,
      previewForm,
      {
        headers: {
          ...previewForm.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!previewResponse.data.success) {
      throw new Error('Preview failed');
    }

    const previewCount = previewResponse.data.data.previewAccounts?.length || 0;
    logSuccess(`Preview successful - showing ${previewCount} accounts`);

    // Step 4: Execute Import
    logStep(4, 'Executing CSV import');
    const importForm = new FormData();
    importForm.append('file', Buffer.from(TEST_CSV), 'test.csv');
    importForm.append('routeName', 'E2E Test Route');
    importForm.append('duplicateStrategy', 'skip');

    const importResponse = await axios.post(
      `${API_URL}/api/import/csv/execute`,
      importForm,
      {
        headers: {
          ...importForm.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!importResponse.data.success) {
      throw new Error(`Import failed: ${importResponse.data.error}`);
    }

    importId = importResponse.data.data.importId;
    routeId = importResponse.data.data.routeId;

    logSuccess('Import executed successfully');
    logInfo(`Import ID: ${importId}`);
    logInfo(`Route ID: ${routeId}`);
    logInfo(`Created: ${importResponse.data.data.createdAccounts} accounts`);
    logInfo(`Updated: ${importResponse.data.data.updatedAccounts} accounts`);
    logInfo(`Skipped: ${importResponse.data.data.skippedAccounts} accounts`);

    // Step 5: Verify Database
    logStep(5, 'Verifying database records');

    // Check route was created
    const routeResult = await dbClient.query(
      'SELECT * FROM routes WHERE id = $1',
      [routeId]
    );

    if (routeResult.rows.length === 0) {
      throw new Error('Route not found in database');
    }

    logSuccess(`Route created: ${routeResult.rows[0].name}`);

    // Check accounts were created
    const accountsResult = await dbClient.query(
      "SELECT * FROM pool_accounts WHERE customer_name LIKE 'E2E Test Customer%' ORDER BY customer_name"
    );

    if (accountsResult.rows.length !== 3) {
      throw new Error(`Expected 3 accounts, found ${accountsResult.rows.length}`);
    }

    logSuccess(`All ${accountsResult.rows.length} accounts created successfully`);

    // Verify account details
    const account1 = accountsResult.rows[0];
    if (account1.customer_name !== 'E2E Test Customer 1' ||
        account1.street !== '123 E2E St' ||
        parseFloat(account1.monthly_rate) !== 200) {
      throw new Error(`Account data mismatch: ${JSON.stringify({
        name: account1.customer_name,
        street: account1.street,
        rate: account1.monthly_rate
      })}`);
    }

    logSuccess('Account data verified correctly');

    // Step 6: Test Duplicate Handling
    logStep(6, 'Testing duplicate handling');

    const duplicateForm = new FormData();
    duplicateForm.append('file', Buffer.from(TEST_CSV), 'test.csv');
    duplicateForm.append('routeId', routeId);
    duplicateForm.append('duplicateStrategy', 'skip');

    const duplicateResponse = await axios.post(
      `${API_URL}/api/import/csv/execute`,
      duplicateForm,
      {
        headers: {
          ...duplicateForm.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (duplicateResponse.data.data.skippedAccounts !== 3) {
      throw new Error(`Expected 3 skipped accounts, got ${duplicateResponse.data.data.skippedAccounts}`);
    }

    logSuccess('Duplicate detection working correctly');

    // Step 7: Test Import History
    logStep(7, 'Checking import history');

    const historyResponse = await axios.get(
      `${API_URL}/api/import/history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!historyResponse.data.success) {
      throw new Error('Failed to fetch import history');
    }

    logSuccess(`Import history retrieved: ${historyResponse.data.data.length} records`);

    // Step 8: Test Error Handling
    logStep(8, 'Testing error handling');

    const invalidCSV = `customer_name,street,city
Missing Fields,123 St,LA`;

    const errorForm = new FormData();
    errorForm.append('file', Buffer.from(invalidCSV), 'invalid.csv');

    try {
      const errorResponse = await axios.post(
        `${API_URL}/api/import/csv/validate`,
        errorForm,
        {
          headers: {
            ...errorForm.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (errorResponse.data.success) {
        throw new Error('Should have failed validation');
      }

      logSuccess('Error handling working correctly');
    } catch (error) {
      if (error.message === 'Should have failed validation') {
        throw error;
      }
      logSuccess('Error handling working correctly');
    }

    // Summary
    log('\n====== Test Summary ======\n', 'bright');
    logSuccess('All tests passed successfully!');
    log('\nTest Coverage:', 'cyan');
    log('  ✓ User authentication');
    log('  ✓ CSV validation');
    log('  ✓ CSV preview');
    log('  ✓ CSV import execution');
    log('  ✓ Database persistence');
    log('  ✓ Duplicate detection');
    log('  ✓ Import history');
    log('  ✓ Error handling');

  } catch (error) {
    log('\n====== Test Failed ======\n', 'bright');
    logError(error.message);
    if (error.response?.data) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Cleanup
    await cleanupTestData();
    if (dbClient) {
      await dbClient.end();
    }
  }
}

// Run the test
runE2ETest().then(() => {
  log('\n✨ E2E Import Flow Test Completed Successfully!', 'green');
  process.exit(0);
}).catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});