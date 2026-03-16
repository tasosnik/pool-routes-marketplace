import knex, { Knex } from 'knex';
import path from 'path';

const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'poolroute',
    password: process.env.DB_PASSWORD || 'development',
    database: process.env.DB_NAME || 'poolroute_dev'
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, '../migrations')
  },
  seeds: {
    directory: path.join(__dirname, '../seeds')
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false
  }
};

// Use DATABASE_URL in production if available
if (process.env.DATABASE_URL) {
  knexConfig.connection = process.env.DATABASE_URL;
}

export const db = knex(knexConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeConnection = async (): Promise<void> => {
  try {
    await db.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};