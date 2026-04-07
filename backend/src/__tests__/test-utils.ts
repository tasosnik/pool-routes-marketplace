import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { generateTokens } from '../utils/jwt';
import { User, UserRole } from '../types';

// Test data factories
export const createTestUser = async (overrides: Partial<User> = {}): Promise<User> => {
  const defaultUser: User = {
    id: uuidv4(),
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1-555-0100',
    company: 'Test Company',
    role: UserRole.OPERATOR,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  const passwordHash = await bcrypt.hash('password123', 12);

  await db('users').insert({
    id: defaultUser.id,
    email: defaultUser.email,
    password_hash: passwordHash,
    first_name: defaultUser.firstName,
    last_name: defaultUser.lastName,
    phone: defaultUser.phone,
    company: defaultUser.company,
    role: defaultUser.role,
    email_verified: defaultUser.emailVerified,
    created_at: defaultUser.createdAt,
    updated_at: defaultUser.updatedAt
  });

  return defaultUser;
};

export const createTestTokens = (user: User) => {
  return generateTokens(user);
};

export const createTestRoute = async (ownerId: string, overrides: any = {}) => {
  const defaultRoute = {
    id: uuidv4(),
    owner_id: ownerId,
    name: 'Test Route',
    description: 'Test route description',
    service_area_name: 'Test City, CA',
    service_area_center: JSON.stringify({ latitude: 34.0522, longitude: -118.2437 }),
    service_area_radius: 5.0,
    total_accounts: 10,
    active_accounts: 9,
    monthly_revenue: 5000.00,
    average_rate: 555.56,
    is_for_sale: false,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };

  await db('routes').insert(defaultRoute);
  return defaultRoute;
};

export const createTestPoolAccount = async (routeId: string, overrides: any = {}) => {
  const defaultAccount = {
    id: uuidv4(),
    route_id: routeId,
    customer_name: 'Test Customer',
    customer_email: 'customer@test.com',
    customer_phone: '+1-555-0200',
    street: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zip_code: '90210',
    coordinates: JSON.stringify({ latitude: 34.0522, longitude: -118.2437 }),
    service_type: 'weekly',
    frequency: 'weekly',
    monthly_rate: 500.00,
    pool_type: 'chlorine',
    pool_size: 'medium',
    status: 'active',
    start_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };

  await db('pool_accounts').insert(defaultAccount);
  return defaultAccount;
};

// Database helpers
export const clearTestData = async () => {
  const tables = ['payment_history', 'pool_accounts', 'route_listings', 'routes', 'users'];
  for (const table of tables) {
    await db(table).del();
  }
};

export const getTestDatabaseConnection = () => db;