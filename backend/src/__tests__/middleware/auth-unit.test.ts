import { Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth, requireRole, requireAdmin, requireSeller, requireBuyer, requireOperator } from '../../middleware/auth';
import { verifyAccessToken } from '../../utils/jwt';
import { User } from '../../models/User';
import { UserRole } from '../../types';

// Mock the dependencies
jest.mock('../../utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
  extractTokenFromHeader: (authHeader?: string): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer " prefix
  }
}));

jest.mock('../../models/User', () => ({
  User: {
    findById: jest.fn()
  }
}));

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;
const mockUser = User as jest.Mocked<typeof User>;

// Helper to create mock request/response objects
const createMockReq = (authHeader?: string, params: Record<string, string> = {}): Partial<Request> => ({
  headers: {
    authorization: authHeader
  },
  params,
  user: undefined
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('Authentication Middleware - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const req = createMockReq('Bearer valid-token');
      const res = createMockRes();
      const next = createMockNext();

      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'operator',
        type: 'access' as const
      };

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.OPERATOR,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockVerifyAccessToken.mockReturnValue(mockPayload);
      mockUser.findById.mockResolvedValue(mockUserData);

      await authenticateToken(req as Request, res as Response, next);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockUser.findById).toHaveBeenCalledWith('user-123');
      expect((req as any).user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.OPERATOR
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      const req = createMockReq('Invalid header');
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const req = createMockReq('Bearer invalid-token');
      const res = createMockRes();
      const next = createMockNext();

      mockVerifyAccessToken.mockReturnValue(null);

      await authenticateToken(req as Request, res as Response, next);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when user no longer exists', async () => {
      const req = createMockReq('Bearer valid-token');
      const res = createMockRes();
      const next = createMockNext();

      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'operator',
        type: 'access' as const
      };

      mockVerifyAccessToken.mockReturnValue(mockPayload);
      mockUser.findById.mockResolvedValue(null);

      await authenticateToken(req as Request, res as Response, next);

      expect(mockUser.findById).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const req = createMockReq('Bearer valid-token');
      const res = createMockRes();
      const next = createMockNext();

      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'operator',
        type: 'access' as const
      };

      mockVerifyAccessToken.mockReturnValue(mockPayload);
      mockUser.findById.mockRejectedValue(new Error('Database error'));

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', async () => {
      const req = createMockReq('Bearer valid-token');
      const res = createMockRes();
      const next = createMockNext();

      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'operator',
        type: 'access' as const
      };

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.OPERATOR,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockVerifyAccessToken.mockReturnValue(mockPayload);
      mockUser.findById.mockResolvedValue(mockUserData);

      await optionalAuth(req as Request, res as Response, next);

      expect((req as any).user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.OPERATOR
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should proceed without user when no token provided', async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await optionalAuth(req as Request, res as Response, next);

      expect((req as any).user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should proceed without user when invalid token provided', async () => {
      const req = createMockReq('Bearer invalid-token');
      const res = createMockRes();
      const next = createMockNext();

      mockVerifyAccessToken.mockReturnValue(null);

      await optionalAuth(req as Request, res as Response, next);

      expect((req as any).user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should proceed without user when database error occurs', async () => {
      const req = createMockReq('Bearer valid-token');
      const res = createMockRes();
      const next = createMockNext();

      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'operator',
        type: 'access' as const
      };

      mockVerifyAccessToken.mockReturnValue(mockPayload);
      mockUser.findById.mockRejectedValue(new Error('Database error'));

      await optionalAuth(req as Request, res as Response, next);

      expect((req as any).user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      const req = createMockReq();
      (req as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.ADMIN };
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole(UserRole.ADMIN);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', () => {
      const req = createMockReq();
      (req as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.SELLER };
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole([UserRole.SELLER, UserRole.ADMIN]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject access when user not authenticated', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole(UserRole.ADMIN);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject access when user lacks required role', () => {
      const req = createMockReq();
      (req as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.OPERATOR };
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole(UserRole.ADMIN);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('convenience role middlewares', () => {
    it('requireAdmin should allow admin access', () => {
      const req = createMockReq();
      (req as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.ADMIN };
      const res = createMockRes();
      const next = createMockNext();

      requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('requireSeller should allow seller and admin access', () => {
      const req1 = createMockReq();
      (req1 as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.SELLER };
      const res1 = createMockRes();
      const next1 = createMockNext();

      requireSeller(req1 as Request, res1 as Response, next1);

      expect(next1).toHaveBeenCalled();
      expect(res1.status).not.toHaveBeenCalled();

      const req2 = createMockReq();
      (req2 as any).user = { id: 'admin-123', email: 'admin@example.com', role: UserRole.ADMIN };
      const res2 = createMockRes();
      const next2 = createMockNext();

      requireSeller(req2 as Request, res2 as Response, next2);

      expect(next2).toHaveBeenCalled();
      expect(res2.status).not.toHaveBeenCalled();
    });

    it('requireBuyer should allow buyer and admin access', () => {
      const req1 = createMockReq();
      (req1 as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.BUYER };
      const res1 = createMockRes();
      const next1 = createMockNext();

      requireBuyer(req1 as Request, res1 as Response, next1);

      expect(next1).toHaveBeenCalled();
      expect(res1.status).not.toHaveBeenCalled();
    });

    it('requireOperator should allow operator and admin access', () => {
      const req1 = createMockReq();
      (req1 as any).user = { id: 'user-123', email: 'test@example.com', role: UserRole.OPERATOR };
      const res1 = createMockRes();
      const next1 = createMockNext();

      requireOperator(req1 as Request, res1 as Response, next1);

      expect(next1).toHaveBeenCalled();
      expect(res1.status).not.toHaveBeenCalled();
    });
  });
});