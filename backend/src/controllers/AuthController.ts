import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateTokens, verifyRefreshToken, extractTokenFromHeader } from '../utils/jwt';
import { ApiResponse } from '@shared/types';

export class AuthController {
  // User registration
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone, company, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        } as ApiResponse);
        return;
      }

      // Create new user
      const user = await User.createUser({
        email,
        password,
        firstName,
        lastName,
        phone,
        company,
        role
      });

      // Generate tokens
      const tokens = generateTokens(user);

      res.status(201).json({
        success: true,
        data: {
          user,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.accessExpiresAt
          }
        },
        message: 'User registered successfully'
      } as ApiResponse);

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during registration'
      } as ApiResponse);
    }
  }

  // User login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate user credentials
      const user = await User.validatePassword(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        } as ApiResponse);
        return;
      }

      // Check if email is verified (optional for MVP)
      if (!user.emailVerified) {
        // In production, you might want to require email verification
        console.warn(`User ${user.email} logged in with unverified email`);
      }

      // Generate tokens
      const tokens = generateTokens(user);

      res.json({
        success: true,
        data: {
          user,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.accessExpiresAt
          }
        },
        message: 'Login successful'
      } as ApiResponse);

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login'
      } as ApiResponse);
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        } as ApiResponse);
        return;
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        } as ApiResponse);
        return;
      }

      // Get user to generate new tokens
      const user = await User.findById(payload.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found'
        } as ApiResponse);
        return;
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.accessExpiresAt
          }
        },
        message: 'Token refreshed successfully'
      } as ApiResponse);

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh'
      } as ApiResponse);
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const user = await User.getUserProfile(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User profile not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: { user },
        message: 'Profile retrieved successfully'
      } as ApiResponse);

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error retrieving profile'
      } as ApiResponse);
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const { firstName, lastName, phone, company } = req.body;

      const updatedUser = await User.updateProfile(req.user.id, {
        firstName,
        lastName,
        phone,
        company
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully'
      } as ApiResponse);

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error updating profile'
      } as ApiResponse);
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const user = await User.validatePassword(req.user.email, currentPassword);
      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        } as ApiResponse);
        return;
      }

      // Update password
      const success = await User.updatePassword(req.user.id, newPassword);
      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update password'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      } as ApiResponse);

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error changing password'
      } as ApiResponse);
    }
  }

  // Logout (client-side token removal)
  static async logout(req: Request, res: Response): Promise<void> {
    // For JWT tokens, logout is primarily handled on the client side
    // by removing the tokens from storage. In a production environment,
    // you might want to implement a token blacklist.

    res.json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse);
  }

  // Verify token endpoint (useful for client-side token validation)
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required'
        } as ApiResponse);
        return;
      }

      // Token validation is already handled by the auth middleware
      // If we reach this point, the token is valid
      res.json({
        success: true,
        data: {
          user: req.user,
          valid: true
        },
        message: 'Token is valid'
      } as ApiResponse);

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error verifying token'
      } as ApiResponse);
    }
  }
}