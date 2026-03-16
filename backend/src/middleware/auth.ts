import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { User } from '../models/User';
import { UserRole } from '@shared/types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await User.findById(payload.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common role requirements
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireSeller = requireRole([UserRole.SELLER, UserRole.ADMIN]);
export const requireBuyer = requireRole([UserRole.BUYER, UserRole.ADMIN]);
export const requireOperator = requireRole([UserRole.OPERATOR, UserRole.ADMIN]);

// Check if user owns resource
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const resourceId = req.params[resourceIdParam];

    // Admins can access any resource
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // For routes, check if user owns the route
    if (req.route.path.includes('/routes/')) {
      try {
        const route = await User.raw(`
          SELECT owner_id FROM routes WHERE id = ?
        `, [resourceId]);

        if (!route.rows[0] || route.rows[0].owner_id !== req.user.id) {
          res.status(403).json({
            success: false,
            error: 'Access denied: You do not own this resource'
          });
          return;
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Error checking resource ownership'
        });
        return;
      }
    }

    next();
  };
};