import request from 'supertest';
import app from '../app';
import { createTestUser, createTestTokens, clearTestData } from './test-utils';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole } from '../types';

describe('Authentication', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '+1-555-0123',
        company: 'New Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject registration with existing email', async () => {
      const user = await createTestUser({ email: 'existing@example.com' });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Duplicate',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login demo user successfully', async () => {
      const user = await createTestUser({
        email: 'admin@poolroute.com',
        firstName: 'Admin',
        lastName: 'User'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@poolroute.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('admin@poolroute.com');
      expect(response.body.data.user.firstName).toBe('Admin');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Verify token is valid
      const payload = verifyAccessToken(response.body.data.tokens.accessToken);
      expect(payload?.userId).toBe(user.id);
      expect(payload?.email).toBe(user.email);
    });

    it('should login all demo users with password123', async () => {
      const demoUsers = [
        { email: 'admin@poolroute.com', firstName: 'Admin', role: UserRole.ADMIN },
        { email: 'john.smith@example.com', firstName: 'John', role: UserRole.OPERATOR },
        { email: 'sarah.johnson@example.com', firstName: 'Sarah', role: UserRole.OPERATOR },
        { email: 'mike.wilson@example.com', firstName: 'Mike', role: UserRole.SELLER },
        { email: 'lisa.brown@example.com', firstName: 'Lisa', role: UserRole.BUYER }
      ];

      for (const userData of demoUsers) {
        await createTestUser(userData);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(userData.email);
        expect(response.body.data.user.firstName).toBe(userData.firstName);
        expect(response.body.data.tokens.accessToken).toBeDefined();
      }
    });

    it('should reject invalid credentials', async () => {
      await createTestUser({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const user = await createTestUser();
      const tokens = createTestTokens(user);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-token', () => {
    it('should verify valid token', async () => {
      const user = await createTestUser();
      const tokens = createTestTokens(user);

      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const user = await createTestUser();
      const tokens = createTestTokens(user);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // New token should be different (or at least valid)
      const newTokenPayload = verifyAccessToken(response.body.data.tokens.accessToken);
      expect(newTokenPayload).toBeTruthy();
      expect(newTokenPayload?.userId).toBe(user.id);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const tokens = createTestTokens(user);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });
  });
});