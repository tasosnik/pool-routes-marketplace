import jwt from 'jsonwebtoken';
import { User as IUser } from '@shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export const generateTokens = (user: IUser) => {
  const payload: Omit<JWTPayload, 'type'> = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
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

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
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