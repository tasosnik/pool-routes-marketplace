import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';

describe('Route Registration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for authenticated endpoints
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@poolroute.com',
        password: 'password123'
      });

    if (loginResponse.status === 200 && loginResponse.body.data?.tokens?.accessToken) {
      authToken = loginResponse.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Health Check', () => {
    it('should have health endpoint registered', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Auth Routes', () => {
    it('should have login endpoint registered', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      // Should get 401 (wrong password) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have register endpoint registered', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should get 400 (bad request) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have profile endpoint registered', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken || 'invalid'}`);

      // Should not get 404
      expect(response.status).not.toBe(404);
    });

    it('should have refresh endpoint registered', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      // Should not get 404
      expect(response.status).not.toBe(404);
    });

    it('should have logout endpoint registered', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      // Should not get 404
      expect(response.status).not.toBe(404);
    });

    it('should have change password endpoint registered', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken || 'invalid'}`)
        .send({});

      // Should not get 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('Import Routes', () => {
    it('should have CSV validation endpoint registered', async () => {
      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken || 'invalid'}`);

      // Should not get 404 - this is the exact issue we fixed!
      expect(response.status).not.toBe(404);

      // Should get 400 (no file) or 401 (no auth) but NOT 404
      expect([400, 401]).toContain(response.status);
    });

    it('should have CSV preview endpoint registered', async () => {
      const response = await request(app)
        .post('/api/import/csv/preview')
        .set('Authorization', `Bearer ${authToken || 'invalid'}`);

      // Should not get 404
      expect(response.status).not.toBe(404);
      expect([400, 401]).toContain(response.status);
    });

    it('should have CSV execute endpoint registered', async () => {
      const response = await request(app)
        .post('/api/import/csv/execute')
        .set('Authorization', `Bearer ${authToken || 'invalid'}`);

      // Should not get 404
      expect(response.status).not.toBe(404);
      expect([400, 401]).toContain(response.status);
    });

    it('should have templates endpoint registered', async () => {
      const response = await request(app)
        .get('/api/import/templates');

      // Should get 200 (templates are public)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should have template download endpoint registered', async () => {
      const response = await request(app)
        .get('/api/import/templates/download/test.csv');

      // Should not get 404 (might get 400 for invalid file)
      expect(response.status).not.toBe(404);
    });

    it('should have import history endpoint registered', async () => {
      const response = await request(app)
        .get('/api/import/history')
        .set('Authorization', `Bearer ${authToken || 'invalid'}`);

      // Should not get 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unregistered routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent/route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({ invalid: 'data' });

      // Should handle gracefully, not crash
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('HTTP Methods', () => {
    it('should use POST for import validation', async () => {
      // Test wrong method
      const getResponse = await request(app)
        .get('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);

      // Test correct method
      const postResponse = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(postResponse.status).not.toBe(404);
    });

    it('should use GET for templates', async () => {
      // Test correct method
      const getResponse = await request(app)
        .get('/api/import/templates');

      expect(getResponse.status).toBe(200);

      // Test wrong method
      const postResponse = await request(app)
        .post('/api/import/templates');

      expect(postResponse.status).toBe(404);
    });
  });

  describe('Authentication Requirements', () => {
    it('should require auth for CSV validation', async () => {
      const response = await request(app)
        .post('/api/import/csv/validate');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    it('should not require auth for templates', async () => {
      const response = await request(app)
        .get('/api/import/templates');

      expect(response.status).toBe(200);
    });

    it('should require auth for import history', async () => {
      const response = await request(app)
        .get('/api/import/history');

      expect(response.status).toBe(401);
    });
  });
});

describe('Route Registration Guard Tests', () => {
  it('should ensure all expected routes are mounted', () => {
    const expectedRoutes = [
      { path: '/health', method: 'GET' },
      { path: '/api/auth/login', method: 'POST' },
      { path: '/api/auth/register', method: 'POST' },
      { path: '/api/auth/profile', method: 'GET' },
      { path: '/api/auth/refresh', method: 'POST' },
      { path: '/api/auth/logout', method: 'POST' },
      { path: '/api/import/csv/validate', method: 'POST' },
      { path: '/api/import/csv/preview', method: 'POST' },
      { path: '/api/import/csv/execute', method: 'POST' },
      { path: '/api/import/templates', method: 'GET' },
      { path: '/api/import/history', method: 'GET' },
    ];

    // Get registered routes from Express app
    const routes: any[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        // Direct routes
        const methods = Object.keys(middleware.route.methods)
          .filter(method => middleware.route.methods[method])
          .map(method => method.toUpperCase());

        methods.forEach(method => {
          routes.push({
            path: middleware.route.path,
            method
          });
        });
      } else if (middleware.name === 'router' && middleware.regexp) {
        // Router middleware
        const regexp = middleware.regexp.toString();
        let basePath = '';

        // Extract base path from regexp
        if (regexp.includes('auth')) basePath = '/api/auth';
        if (regexp.includes('import')) basePath = '/api/import';

        if (basePath && middleware.handle.stack) {
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods)
                .filter((method: string) => handler.route.methods[method])
                .map((method: string) => method.toUpperCase());

              methods.forEach((method: string) => {
                routes.push({
                  path: basePath + handler.route.path,
                  method
                });
              });
            }
          });
        }
      }
    });

    // Check that all expected routes exist
    expectedRoutes.forEach(expected => {
      const found = routes.some(route =>
        route.path === expected.path && route.method === expected.method
      );

      if (!found) {
        console.error(`Missing route: ${expected.method} ${expected.path}`);
        console.log('Available routes:', routes);
      }

      expect(found).toBe(true);
    });
  });
});