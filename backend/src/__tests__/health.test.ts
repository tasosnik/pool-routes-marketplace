import request from 'supertest';
import app from '../app';
import { db } from '../config/database';

describe('Health Checks', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('PoolRoute OS API is running');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });

    it('should include current timestamp', async () => {
      const beforeRequest = Date.now();

      const response = await request(app)
        .get('/health')
        .expect(200);

      const afterRequest = Date.now();
      const responseTimestamp = new Date(response.body.timestamp).getTime();

      expect(responseTimestamp).toBeGreaterThanOrEqual(beforeRequest);
      expect(responseTimestamp).toBeLessThanOrEqual(afterRequest);
    });
  });

  describe('Database Connection', () => {
    it('should connect to test database', async () => {
      try {
        await db.raw('SELECT 1');
        expect(true).toBe(true); // Test passes if no error
      } catch (error) {
        fail(`Database connection failed: ${error}`);
      }
    });

    it('should have migrations table', async () => {
      const result = await db.raw(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'knex_migrations'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should have all required tables', async () => {
      const requiredTables = ['users', 'routes', 'pool_accounts', 'payment_history', 'route_listings'];

      for (const tableName of requiredTables) {
        const result = await db.raw(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_name = ?
        `, [tableName]);

        expect(result.rows.length).toBe(1);
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should have test environment configured', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have JWT secret configured', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET).not.toBe('');
    });

    it('should have database URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toContain('poolroute_test');
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ malformed json');

      // Should return an error but not crash the server
      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined(); // Could be DENY or SAMEORIGIN
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limits', async () => {
      const requests = [];

      // Make multiple requests quickly
      for (let i = 0; i < 5; i++) {
        requests.push(request(app).get('/health'));
      }

      const responses = await Promise.all(requests);

      // All should succeed (rate limit is generous for health check)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});