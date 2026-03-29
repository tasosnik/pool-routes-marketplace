import crypto from 'crypto';

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  MAPBOX_ACCESS_TOKEN?: string;
  REDIS_URL?: string;
  JWT_EXPIRES_IN?: string;
  JWT_REFRESH_EXPIRES_IN?: string;
}

// Validation rules for different environments
const VALIDATION_RULES = {
  JWT_SECRET: {
    minLength: 32,
    bannedValues: [
      'poolroute-development-secret-key-change-in-production',
      'REPLACE_WITH_SECURE_RANDOM_SECRET_IN_PRODUCTION',
      'your-secret-here',
      'development',
      'secret'
    ]
  },
  MAPBOX_ACCESS_TOKEN: {
    pattern: /^pk\..+/,
    bannedValues: [
      'pk.your_mapbox_public_token_here',
      'your_token_here'
    ]
  }
};

/**
 * Generates a cryptographically secure random secret
 */
export function generateSecureSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Validates JWT secret strength and security
 */
function validateJWTSecret(secret: string): { isValid: boolean; error?: string } {
  if (!secret) {
    return { isValid: false, error: 'JWT_SECRET is required' };
  }

  if (secret.length < VALIDATION_RULES.JWT_SECRET.minLength) {
    return {
      isValid: false,
      error: `JWT_SECRET must be at least ${VALIDATION_RULES.JWT_SECRET.minLength} characters long`
    };
  }

  if (VALIDATION_RULES.JWT_SECRET.bannedValues.includes(secret)) {
    const suggestedSecret = generateSecureSecret();
    return {
      isValid: false,
      error: `JWT_SECRET is using a default/weak value. Generate a secure secret with:\n` +
             `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"\n\n` +
             `Suggested secret: ${suggestedSecret}`
    };
  }

  // Check for entropy (simple check - should not be all same character or sequential)
  if (/^(.)\1+$/.test(secret) || /^(012|123|234|345|456|567|678|789|890|abc|def|fed|cba)/.test(secret.toLowerCase())) {
    return { isValid: false, error: 'JWT_SECRET appears to have low entropy' };
  }

  return { isValid: true };
}

/**
 * Validates Mapbox token format
 */
function validateMapboxToken(token?: string): { isValid: boolean; error?: string } {
  if (!token) {
    // Mapbox token is optional for basic functionality
    return { isValid: true };
  }

  if (VALIDATION_RULES.MAPBOX_ACCESS_TOKEN.bannedValues.includes(token)) {
    return {
      isValid: false,
      error: 'MAPBOX_ACCESS_TOKEN is using a placeholder value. Get a real token from https://account.mapbox.com/access-tokens/'
    };
  }

  if (!VALIDATION_RULES.MAPBOX_ACCESS_TOKEN.pattern.test(token)) {
    return {
      isValid: false,
      error: 'MAPBOX_ACCESS_TOKEN must start with "pk." for public tokens'
    };
  }

  return { isValid: true };
}

/**
 * Validates database URL format
 */
function validateDatabaseURL(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'DATABASE_URL is required' };
  }

  // Check if it's a PostgreSQL URL
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    return { isValid: false, error: 'DATABASE_URL must be a PostgreSQL connection string' };
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: 'DATABASE_URL is not a valid URL' };
  }

  return { isValid: true };
}

/**
 * Validates and loads environment configuration
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV as any;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be one of: development, test, production');
  }

  // Validate PORT
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  // Validate DATABASE_URL
  const dbValidation = validateDatabaseURL(process.env.DATABASE_URL || '');
  if (!dbValidation.isValid) {
    errors.push(dbValidation.error!);
  }

  // Validate JWT_SECRET
  const jwtValidation = validateJWTSecret(process.env.JWT_SECRET || '');
  if (!jwtValidation.isValid) {
    errors.push(jwtValidation.error!);
  }

  // Validate MAPBOX_ACCESS_TOKEN (warn in development, error in production)
  const mapboxValidation = validateMapboxToken(process.env.MAPBOX_ACCESS_TOKEN);
  if (!mapboxValidation.isValid) {
    if (nodeEnv === 'production') {
      errors.push(mapboxValidation.error!);
    } else {
      console.warn(`⚠️  ${mapboxValidation.error!}`);
    }
  }

  // If there are validation errors, throw with detailed message
  if (errors.length > 0) {
    const errorMessage = '❌ Environment validation failed:\n\n' +
                        errors.map(error => `  • ${error}`).join('\n') +
                        '\n\n💡 Check your .env file and fix the above issues.';
    throw new Error(errorMessage);
  }

  // Return validated config
  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN
  };
}

/**
 * Initializes environment validation on module load
 */
export function initializeEnvironment(): EnvironmentConfig {
  try {
    const config = validateEnvironment();

    if (config.NODE_ENV === 'development') {
      console.log('🔧 Development environment detected');
      if (!config.MAPBOX_ACCESS_TOKEN || config.MAPBOX_ACCESS_TOKEN.includes('your_mapbox')) {
        console.warn('⚠️  Mapbox token not configured - map functionality will be limited');
      }
    }

    return config;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}