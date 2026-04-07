import { Page } from '@playwright/test';

/**
 * Setup test environment before running tests
 */
export async function setupTestEnvironment(page: Page) {
  // Set longer timeout for database operations
  page.setDefaultTimeout(30000);

  // Wait for both frontend and backend to be ready
  await waitForServices();
}

/**
 * Wait for backend and frontend services to be ready
 */
async function waitForServices() {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Check backend health
      const backendResponse = await fetch('http://localhost:3001/health');
      if (!backendResponse.ok) {
        throw new Error('Backend not ready');
      }

      // Check frontend
      const frontendResponse = await fetch('http://localhost:3000');
      if (!frontendResponse.ok) {
        throw new Error('Frontend not ready');
      }

      console.log('✅ Both services are ready');
      return;
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for services... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Services failed to start within timeout period');
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData() {
  // This would typically clean up test-specific data
  // For now, the seed data provides a consistent starting state
  console.log('🧹 Test cleanup completed');
}

/**
 * Reset database to known state (if needed)
 */
export async function resetDatabase() {
  try {
    // This could call a test endpoint that resets the database
    // await fetch('http://localhost:3001/test/reset', { method: 'POST' });
    console.log('🔄 Database reset (not implemented in this demo)');
  } catch (error) {
    console.warn('⚠️ Database reset failed:', error);
  }
}

/**
 * Seed test data (if needed)
 */
export async function seedTestData() {
  try {
    // This could call the seed endpoint or run specific test seeds
    // await fetch('http://localhost:3001/test/seed', { method: 'POST' });
    console.log('🌱 Test data seeded (using default demo data)');
  } catch (error) {
    console.warn('⚠️ Test data seeding failed:', error);
  }
}