import jwt, { SignOptions, JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { User as IUser } from '../types';

// Utility function to generate a secure random secret
export const generateSecureSecret = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// Validate JWT secret is provided
if (!process.env.JWT_SECRET) {
  const suggestedSecret = generateSecureSecret();
  throw new Error(
    '🔐 JWT_SECRET environment variable is required!\n\n' +
    'Add this to your .env file:\n' +
    `JWT_SECRET=${suggestedSecret}\n\n` +
    '⚠️  NEVER use a weak secret in production!'
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface JWTPayload extends BaseJwtPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export const generateTokens = (user: IUser): TokenResponse => {
  const accessPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  const refreshPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh'
  };

  const accessToken = jwt.sign(
    accessPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );

  const refreshToken = jwt.sign(
    refreshPayload,
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );

  // Calculate expiration dates
  const accessExpiresAt = new Date();
  accessExpiresAt.setDate(accessExpiresAt.getDate() + 7); // 7 days

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

  return {
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt
  };
};

// Type guard to validate JWTPayload structure
function isValidJWTPayload(decoded: any): decoded is JWTPayload {
  return (
    decoded &&
    typeof decoded === 'object' &&
    typeof decoded.userId === 'string' &&
    typeof decoded.email === 'string' &&
    typeof decoded.role === 'string' &&
    (decoded.type === 'access' || decoded.type === 'refresh')
  );
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate payload structure using type guard
    if (!isValidJWTPayload(decoded)) {
      console.warn('Invalid JWT payload structure:', decoded);
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.debug('JWT token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Invalid JWT token:', error.message);
    } else {
      console.error('JWT verification error:', error instanceof Error ? error.message : String(error));
    }
    return null;
  }
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'access') {
    return null;
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'refresh') {
    return null;
  }
  return decoded;
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
};