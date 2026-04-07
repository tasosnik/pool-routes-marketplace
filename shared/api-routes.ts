/**
 * Shared API Route Constants
 *
 * Single source of truth for all API endpoints to prevent
 * frontend/backend drift and route mismatch errors
 */

export const API_ROUTES = {
  // Base paths
  BASE: '/api',

  // Authentication routes
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    CHANGE_PASSWORD: '/api/auth/change-password',
    VERIFY_TOKEN: '/api/auth/verify-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // Import routes
  IMPORT: {
    BASE: '/api/import',
    CSV_VALIDATE: '/api/import/csv/validate',
    CSV_PREVIEW: '/api/import/csv/preview',
    CSV_EXECUTE: '/api/import/csv/execute',
    TEMPLATES: '/api/import/templates',
    TEMPLATE_DOWNLOAD: '/api/import/templates/download/:filename',
    HISTORY: '/api/import/history',
    STATUS: '/api/import/status/:importId',
  },

  // Route management
  ROUTES: {
    BASE: '/api/routes',
    LIST: '/api/routes',
    CREATE: '/api/routes',
    GET: '/api/routes/:id',
    UPDATE: '/api/routes/:id',
    DELETE: '/api/routes/:id',
    STATS: '/api/routes/:id/stats',
    ACCOUNTS: '/api/routes/:id/accounts',
    TRANSFER: '/api/routes/:id/transfer',
  },

  // Pool accounts
  ACCOUNTS: {
    BASE: '/api/accounts',
    LIST: '/api/accounts',
    CREATE: '/api/accounts',
    GET: '/api/accounts/:id',
    UPDATE: '/api/accounts/:id',
    DELETE: '/api/accounts/:id',
    SERVICE_HISTORY: '/api/accounts/:id/service-history',
    PAYMENTS: '/api/accounts/:id/payments',
  },

  // Marketplace
  MARKETPLACE: {
    BASE: '/api/marketplace',
    LIST: '/api/marketplace/listings',
    CREATE_LISTING: '/api/marketplace/listings',
    GET_LISTING: '/api/marketplace/listings/:id',
    UPDATE_LISTING: '/api/marketplace/listings/:id',
    DELETE_LISTING: '/api/marketplace/listings/:id',
    PURCHASE: '/api/marketplace/listings/:id/purchase',
    OFFERS: '/api/marketplace/listings/:id/offers',
    CREATE_OFFER: '/api/marketplace/listings/:id/offers',
  },

  // Analytics
  ANALYTICS: {
    BASE: '/api/analytics',
    DASHBOARD: '/api/analytics/dashboard',
    REVENUE: '/api/analytics/revenue',
    GROWTH: '/api/analytics/growth',
    CHURN: '/api/analytics/churn',
    EXPORT: '/api/analytics/export',
  },

  // Health and system
  SYSTEM: {
    HEALTH: '/health',
    VERSION: '/api/version',
    STATUS: '/api/status',
  }
} as const;

/**
 * HTTP methods for each endpoint
 */
export const API_METHODS = {
  // Auth
  [API_ROUTES.AUTH.LOGIN]: 'POST',
  [API_ROUTES.AUTH.REGISTER]: 'POST',
  [API_ROUTES.AUTH.PROFILE]: 'GET',
  [API_ROUTES.AUTH.REFRESH]: 'POST',
  [API_ROUTES.AUTH.LOGOUT]: 'POST',
  [API_ROUTES.AUTH.CHANGE_PASSWORD]: 'POST',
  [API_ROUTES.AUTH.VERIFY_TOKEN]: 'POST',

  // Import
  [API_ROUTES.IMPORT.CSV_VALIDATE]: 'POST',
  [API_ROUTES.IMPORT.CSV_PREVIEW]: 'POST',
  [API_ROUTES.IMPORT.CSV_EXECUTE]: 'POST',
  [API_ROUTES.IMPORT.TEMPLATES]: 'GET',
  [API_ROUTES.IMPORT.HISTORY]: 'GET',

  // Health
  [API_ROUTES.SYSTEM.HEALTH]: 'GET',
} as const;

/**
 * Authentication requirements for each endpoint
 */
export const API_AUTH_REQUIRED = {
  // Public endpoints
  [API_ROUTES.AUTH.LOGIN]: false,
  [API_ROUTES.AUTH.REGISTER]: false,
  [API_ROUTES.AUTH.FORGOT_PASSWORD]: false,
  [API_ROUTES.AUTH.RESET_PASSWORD]: false,
  [API_ROUTES.IMPORT.TEMPLATES]: false,
  [API_ROUTES.SYSTEM.HEALTH]: false,
  [API_ROUTES.SYSTEM.VERSION]: false,

  // Protected endpoints
  [API_ROUTES.AUTH.PROFILE]: true,
  [API_ROUTES.AUTH.CHANGE_PASSWORD]: true,
  [API_ROUTES.AUTH.LOGOUT]: true,
  [API_ROUTES.IMPORT.CSV_VALIDATE]: true,
  [API_ROUTES.IMPORT.CSV_PREVIEW]: true,
  [API_ROUTES.IMPORT.CSV_EXECUTE]: true,
  [API_ROUTES.IMPORT.HISTORY]: true,
} as const;

/**
 * Error codes that can be returned by the API
 */
export const API_ERROR_CODES = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',

  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',

  // Import
  INVALID_FILE: 'INVALID_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_CSV: 'INVALID_CSV',
  IMPORT_FAILED: 'IMPORT_FAILED',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  DUPLICATE_DETECTED: 'DUPLICATE_DETECTED',

  // Data validation
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',
  DUPLICATE_ADDRESS: 'DUPLICATE_ADDRESS',
  DUPLICATE_SKIPPED: 'DUPLICATE_SKIPPED',
} as const;

/**
 * Success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

/**
 * Paginated response structure
 */
export interface ApiPaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * Helper function to build API URL with parameters
 */
export function buildApiUrl(route: string, params?: Record<string, string>): string {
  let url = route;

  // Replace route parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }

  return url;
}

/**
 * Helper function to check if endpoint requires authentication
 */
export function requiresAuth(route: string): boolean {
  // Remove parameters from route for checking
  const cleanRoute = route.replace(/\/:[^/]+/g, '/:param');
  return API_AUTH_REQUIRED[cleanRoute as keyof typeof API_AUTH_REQUIRED] ?? true;
}

/**
 * Type guard for success responses
 */
export function isSuccessResponse(response: any): response is ApiSuccessResponse {
  return response && response.success === true;
}

/**
 * Type guard for error responses
 */
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.success === false;
}