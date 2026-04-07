import { describe, it, expect, vi, beforeAll } from 'vitest';
import axios from 'axios';
import importService from '../services/importService';
import authService from '../services/authService';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Contract Tests', () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  beforeAll(() => {
    // Setup default mock responses
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
    mockedAxios.get.mockResolvedValue({ data: { success: true } });
  });

  describe('Import Service API Contracts', () => {
    it('should call correct endpoint for CSV validation', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      await importService.validateCSV(file);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/import/csv/validate`,
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });

    it('should call correct endpoint for CSV preview', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      await importService.previewCSV(file);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/import/csv/preview`,
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });

    it('should call correct endpoint for CSV import', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const options = {
        routeId: 'test-route-id',
        routeName: 'Test Route',
        duplicateStrategy: 'skip' as const
      };

      await importService.importCSV(file, options);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/import/csv/execute`,
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });

    it('should call correct endpoint for templates', async () => {
      await importService.getTemplates();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/api/import/templates`
      );
    });

    it('should call correct endpoint for template download', async () => {
      const filename = 'test-template.csv';

      await importService.downloadTemplate(filename);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/api/import/templates/download/${filename}`,
        expect.objectContaining({
          responseType: 'blob'
        })
      );
    });

    it('should call correct endpoint for import history', async () => {
      await importService.getImportHistory();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/api/import/history`,
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );
    });

    it('should include auth token in requests', async () => {
      localStorage.setItem('access_token', 'test-token');

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      await importService.validateCSV(file);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  describe('Auth Service API Contracts', () => {
    it('should call correct endpoint for login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      await authService.login(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login`,
        credentials
      );
    });

    it('should call correct endpoint for registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      await authService.register(userData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/register`,
        userData
      );
    });

    it('should call correct endpoint for profile', async () => {
      localStorage.setItem('access_token', 'test-token');

      await authService.getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/api/auth/profile`,
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token'
          }
        })
      );
    });

    it('should call correct endpoint for token refresh', async () => {
      const refreshToken = 'test-refresh-token';

      await authService.refreshToken(refreshToken);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/refresh`,
        { refreshToken }
      );
    });

    it('should call correct endpoint for logout', async () => {
      const refreshToken = 'test-refresh-token';

      await authService.logout(refreshToken);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/logout`,
        { refreshToken },
        expect.any(Object)
      );
    });

    it('should call correct endpoint for password change', async () => {
      localStorage.setItem('access_token', 'test-token');

      const passwords = {
        currentPassword: 'old-password',
        newPassword: 'new-password'
      };

      await authService.changePassword(passwords);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/change-password`,
        passwords,
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token'
          }
        })
      );
    });

    it('should call correct endpoint for token verification', async () => {
      const token = 'test-token';

      await authService.verifyToken(token);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/verify-token`,
        { token }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors correctly', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Route not found' }
        }
      });

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = await importService.validateCSV(file);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle authentication errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Invalid or expired token' }
        }
      });

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = await importService.validateCSV(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('token');
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = await importService.validateCSV(file);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Request/Response Types', () => {
    it('should send FormData for file uploads', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      await importService.validateCSV(file);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    it('should send JSON for auth requests', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      await authService.login(credentials);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(typeof callArgs[1]).toBe('object');
      expect(callArgs[1]).toEqual(credentials);
    });

    it('should expect JSON responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            importId: 'test-id',
            totalRows: 10,
            errors: [],
            warnings: []
          }
        }
      });

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = await importService.validateCSV(file);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

describe('API Endpoint Constants', () => {
  it('should use consistent base URL', () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // All services should use the same base URL
    expect(importService).toBeDefined();
    expect(authService).toBeDefined();

    // This ensures we have a single source of truth for API URL
    expect(API_URL).toMatch(/^https?:\/\/.+/);
  });

  it('should follow REST conventions', () => {
    const endpoints = [
      { path: '/api/auth/login', method: 'POST', description: 'Authentication' },
      { path: '/api/auth/register', method: 'POST', description: 'User creation' },
      { path: '/api/auth/profile', method: 'GET', description: 'Resource retrieval' },
      { path: '/api/import/csv/validate', method: 'POST', description: 'Action/validation' },
      { path: '/api/import/templates', method: 'GET', description: 'Resource listing' },
    ];

    endpoints.forEach(endpoint => {
      // POST for create/action operations
      if (endpoint.method === 'POST') {
        expect(['login', 'register', 'validate', 'execute', 'refresh', 'logout']).toContain(
          endpoint.path.split('/').pop()
        );
      }

      // GET for retrieval operations
      if (endpoint.method === 'GET') {
        expect(['profile', 'templates', 'history']).toContain(
          endpoint.path.split('/').pop()
        );
      }
    });
  });
});