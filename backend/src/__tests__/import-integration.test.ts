import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

describe('Import API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@poolroute.com',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    }
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('CSV Validation Endpoint', () => {
    it('should validate a valid CSV file', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
John Doe,123 Main St,Los Angeles,CA,90001,john@email.com,213-555-0001,weekly,weekly,200,chlorine,medium,Test note
Jane Smith,456 Oak Ave,Los Angeles,CA,90002,jane@email.com,213-555-0002,biweekly,biweekly,150,saltwater,large,`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'test.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('importId');
      expect(response.body.data.totalRows).toBe(2);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should reject CSV with missing required fields', async () => {
      const csvContent = `customer_name,street,city
,123 Main St,Los Angeles`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });

    it('should reject CSV with invalid data types', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
John Doe,123 Main St,Los Angeles,CA,90001,john@email.com,213-555-0001,weekly,weekly,not-a-number,chlorine,medium,`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.data.errors).toContainEqual(
        expect.objectContaining({
          code: expect.stringMatching(/INVALID|PARSE/)
        })
      );
    });

    it('should detect duplicate addresses', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
John Doe,123 Main St,Los Angeles,CA,90001,john@email.com,213-555-0001,weekly,weekly,200,chlorine,medium,
Jane Doe,123 Main St,Los Angeles,CA,90001,jane@email.com,213-555-0002,weekly,weekly,200,chlorine,medium,`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'duplicates.csv');

      expect(response.status).toBe(200);
      expect(response.body.data.warnings).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_ADDRESS'
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/import/csv/validate')
        .attach('file', Buffer.from('test'), 'test.csv');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    it('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('not csv'), 'test.txt');

      expect(response.status).toBe(400);
    });

    it('should reject files over size limit', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(largeContent), 'large.csv');

      expect(response.status).toBe(413); // Payload too large
    });
  });

  describe('CSV Preview Endpoint', () => {
    it('should preview first 10 rows', async () => {
      const rows = Array.from({ length: 20 }, (_, i) =>
        `Customer ${i},${i} Main St,Los Angeles,CA,9000${i},customer${i}@email.com,213-555-00${String(i).padStart(2, '0')},weekly,weekly,200,chlorine,medium,`
      );
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes\n${rows.join('\n')}`;

      const response = await request(app)
        .post('/api/import/csv/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'preview.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRows).toBe(20);
      expect(response.body.data.previewAccounts).toHaveLength(10);
    });

    it('should include metadata in preview', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
John Doe,123 Main St,Los Angeles,CA,90001,john@email.com,213-555-0001,weekly,weekly,200,chlorine,medium,`;

      const response = await request(app)
        .post('/api/import/csv/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'preview.csv');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data.metadata).toHaveProperty('columns');
    });
  });

  describe('CSV Execute Endpoint', () => {
    beforeEach(async () => {
      // Clean up any test accounts
      await db('pool_accounts')
        .where('customer_name', 'like', 'Test Import%')
        .delete();
    });

    it('should import CSV data successfully', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
Test Import 1,789 Test St,Los Angeles,CA,90003,test1@import.com,213-555-0003,weekly,weekly,250,chlorine,large,
Test Import 2,790 Test Ave,Los Angeles,CA,90004,test2@import.com,213-555-0004,biweekly,biweekly,175,saltwater,medium,`;

      const response = await request(app)
        .post('/api/import/csv/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .field('routeName', 'Test Import Route')
        .field('duplicateStrategy', 'skip')
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.createdAccounts).toBe(2);
      expect(response.body.data.routeId).toBeDefined();

      // Verify accounts were created
      const accounts = await db('pool_accounts')
        .where('customer_name', 'like', 'Test Import%')
        .select();

      expect(accounts).toHaveLength(2);
    });

    it('should handle duplicate strategy - skip', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
Test Import Dup,999 Dup St,Los Angeles,CA,90005,dup@import.com,213-555-0005,weekly,weekly,300,chlorine,large,`;

      // First import
      await request(app)
        .post('/api/import/csv/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .field('duplicateStrategy', 'skip')
        .attach('file', Buffer.from(csvContent), 'import.csv');

      // Second import with same data
      const response = await request(app)
        .post('/api/import/csv/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .field('duplicateStrategy', 'skip')
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(response.body.data.skippedAccounts).toBeGreaterThan(0);
      expect(response.body.data.warnings).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_SKIPPED'
        })
      );
    });

    it('should use existing route when routeId provided', async () => {
      // Get an existing route
      const routes = await db('routes').select('id').limit(1);

      if (routes.length > 0) {
        const routeId = routes[0].id;
        const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
Test Import Route,888 Route St,Los Angeles,CA,90006,route@import.com,213-555-0006,weekly,weekly,275,chlorine,medium,`;

        const response = await request(app)
          .post('/api/import/csv/execute')
          .set('Authorization', `Bearer ${authToken}`)
          .field('routeId', routeId)
          .attach('file', Buffer.from(csvContent), 'import.csv');

        expect(response.status).toBe(200);
        expect(response.body.data.routeId).toBe(routeId);
      }
    });

    it('should validate only when validateOnly is true', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
Test Validate Only,777 Validate St,Los Angeles,CA,90007,validate@import.com,213-555-0007,weekly,weekly,225,chlorine,small,`;

      const response = await request(app)
        .post('/api/import/csv/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .field('validateOnly', 'true')
        .attach('file', Buffer.from(csvContent), 'validate.csv');

      expect(response.status).toBe(200);
      expect(response.body.data.createdAccounts).toBe(0);

      // Verify no accounts were created
      const accounts = await db('pool_accounts')
        .where('customer_name', 'Test Validate Only')
        .select();

      expect(accounts).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
Valid Import,666 Valid St,Los Angeles,CA,90008,valid@import.com,213-555-0008,weekly,weekly,200,chlorine,medium,
,555 Invalid St,Los Angeles,CA,90009,invalid@import.com,213-555-0009,weekly,weekly,200,chlorine,medium,`;

      const response = await request(app)
        .post('/api/import/csv/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'partial.csv');

      expect(response.body.data.createdAccounts).toBeGreaterThanOrEqual(1);
      expect(response.body.data.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Template Endpoints', () => {
    it('should list available templates', async () => {
      const response = await request(app)
        .get('/api/import/templates');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('url');
    });

    it('should download template file', async () => {
      const response = await request(app)
        .get('/api/import/templates/download/basic-route.csv');

      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('csv');
        expect(response.text).toContain('customer_name');
      } else {
        // Template file might not exist
        expect(response.status).toBe(404);
      }
    });

    it('should reject invalid template names', async () => {
      const response = await request(app)
        .get('/api/import/templates/download/../../../etc/passwd');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid filename');
    });
  });

  describe('Import History Endpoint', () => {
    it('should return import history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/import/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/import/history');

      expect(response.status).toBe(401);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed CSV gracefully', async () => {
      const malformedCsv = `this,is,not,proper,csv
with,mismatched,columns
and,invalid"quotes`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(malformedCsv), 'malformed.csv');

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(false);
        expect(response.body.data.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty CSV file', async () => {
      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(''), 'empty.csv');

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle CSV with only headers', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'headers-only.csv');

      expect(response.status).toBe(200);
      expect(response.body.data.totalRows).toBe(0);
    });

    it('should handle special characters in CSV', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"O'Brien, John",123 "Main" St,Los Angeles,CA,90001,john@email.com,213-555-0001,weekly,weekly,200,chlorine,medium,"Note with, comma"`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'special-chars.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle different CSV encodings', async () => {
      const csvWithBOM = '\uFEFF' + `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
José García,123 Café St,Los Angeles,CA,90001,jose@email.com,213-555-0001,weekly,weekly,200,chlorine,medium,Niño`;

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvWithBOM), 'utf8-bom.csv');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle 100 row CSV within reasonable time', async () => {
      const rows = Array.from({ length: 100 }, (_, i) =>
        `Customer ${i},${i} Main St,City ${i},CA,${90000 + i},customer${i}@email.com,213-555-${String(i).padStart(4, '0')},weekly,weekly,${150 + i},chlorine,medium,Note ${i}`
      );
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes\n${rows.join('\n')}`;

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/import/csv/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), 'large.csv');

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data.totalRows).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});