// Export all models
export { BaseModel } from './BaseModel';
export { User } from './User';
export { Route } from './Route';
export { PoolAccount } from './PoolAccount';

// Model initialization - run migrations if needed
import { db, testConnection } from '../config/database';

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Run migrations
    await db.migrate.latest();
    console.log('✅ Database migrations completed');

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

export { db };