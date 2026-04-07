import { User } from '../../models/User';
import { UserRole } from '../../types';
import bcrypt from 'bcryptjs';

// Mock the BaseModel dependencies
jest.mock('../../config/database', () => ({
  db: {
    raw: jest.fn(),
    transaction: jest.fn(),
    users: {
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn()
    }
  }
}));

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock the query builder
const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn()
});

describe('User Model', () => {
  let mockQuery: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = createMockQueryBuilder();
    // Mock the static query method
    (User as any).query = jest.fn().mockReturnValue(mockQuery);
  });

  describe('findByEmail', () => {
    it('should find user by email (case insensitive)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: UserRole.OPERATOR
      };

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(mockUser);

      const result = await User.findByEmail('TEST@EXAMPLE.COM');

      expect(mockQuery.where).toHaveBeenCalledWith('email', 'test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(null);

      const result = await User.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'NEW@EXAMPLE.COM',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '555-1234',
        company: 'Test Corp',
        role: UserRole.SELLER
      };

      const hashedPassword = 'hashed_password_123';
      const createdUser = {
        id: 'new-user-123',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        phone: '555-1234',
        company: 'Test Corp',
        role: UserRole.SELLER,
        password_hash: hashedPassword,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      (User as any).create = jest.fn().mockResolvedValue(createdUser);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.first_name,
        lastName: createdUser.last_name,
        phone: createdUser.phone,
        company: createdUser.company,
        role: createdUser.role,
        emailVerified: createdUser.email_verified,
        createdAt: createdUser.created_at,
        updatedAt: createdUser.updated_at
      });

      const result = await User.createUser(userData);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect((User as any).create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password_hash: hashedPassword,
        first_name: 'New',
        last_name: 'User',
        phone: '555-1234',
        company: 'Test Corp',
        role: UserRole.SELLER
      });

      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.first_name,
        lastName: createdUser.last_name,
        phone: createdUser.phone,
        company: createdUser.company,
        role: createdUser.role,
        emailVerified: createdUser.email_verified,
        createdAt: createdUser.created_at,
        updatedAt: createdUser.updated_at
      });
    });

    it('should default role to OPERATOR when not specified', async () => {
      const userData = {
        email: 'default@example.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'User'
      };

      const hashedPassword = 'hashed_password_123';
      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      (User as any).create = jest.fn().mockResolvedValue({
        id: 'user-123',
        role: UserRole.OPERATOR
      });
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: 'user-123',
        role: UserRole.OPERATOR
      });

      await User.createUser(userData);

      expect((User as any).create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.OPERATOR
        })
      );
    });

    it('should handle bcrypt hashing errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockBcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(User.createUser(userData)).rejects.toThrow('Hashing failed');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const email = 'test@example.com';
      const password = 'correct_password';
      const userRecord = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: UserRole.OPERATOR
      };

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(userRecord);
      mockBcrypt.compare.mockResolvedValue(true);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        role: userRecord.role
      });

      const result = await User.validatePassword(email, password);

      expect(mockQuery.where).toHaveBeenCalledWith('email', 'test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, 'hashed_password');
      expect(result).toEqual({
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        role: userRecord.role
      });
    });

    it('should return null for incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrong_password';
      const userRecord = {
        id: 'user-123',
        password_hash: 'hashed_password'
      };

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(userRecord);
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await User.validatePassword(email, password);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, 'hashed_password');
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      const email = 'notfound@example.com';
      const password = 'any_password';

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(null);

      const result = await User.validatePassword(email, password);

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should normalize email case', async () => {
      const email = 'TEST@EXAMPLE.COM';
      const password = 'password';

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(null);

      await User.validatePassword(email, password);

      expect(mockQuery.where).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  describe('updatePassword', () => {
    it('should update password with new hash', async () => {
      const userId = 'user-123';
      const newPassword = 'new_password';
      const hashedPassword = 'new_hashed_password';

      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      (User as any).updateById = jest.fn().mockResolvedValue({ id: userId });

      const result = await User.updatePassword(userId, newPassword);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect((User as any).updateById).toHaveBeenCalledWith(userId, {
        password_hash: hashedPassword
      });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      const userId = 'user-123';
      const newPassword = 'new_password';
      const hashedPassword = 'new_hashed_password';

      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      (User as any).updateById = jest.fn().mockResolvedValue(null);

      const result = await User.updatePassword(userId, newPassword);

      expect(result).toBe(false);
    });

    it('should handle bcrypt hashing errors', async () => {
      const userId = 'user-123';
      const newPassword = 'new_password';

      mockBcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(User.updatePassword(userId, newPassword)).rejects.toThrow('Hashing failed');
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified', async () => {
      const userId = 'user-123';
      (User as any).updateById = jest.fn().mockResolvedValue({ id: userId });

      const result = await User.verifyEmail(userId);

      expect((User as any).updateById).toHaveBeenCalledWith(userId, {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null
      });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      const userId = 'user-123';
      (User as any).updateById = jest.fn().mockResolvedValue(null);

      const result = await User.verifyEmail(userId);

      expect(result).toBe(false);
    });
  });

  describe('setVerificationToken', () => {
    it('should set verification token and expiry', async () => {
      const userId = 'user-123';
      const token = 'verify_token_123';
      const expiresAt = new Date();
      (User as any).updateById = jest.fn().mockResolvedValue({ id: userId });

      const result = await User.setVerificationToken(userId, token, expiresAt);

      expect((User as any).updateById).toHaveBeenCalledWith(userId, {
        verification_token: token,
        verification_token_expires: expiresAt
      });
      expect(result).toBe(true);
    });
  });

  describe('setResetPasswordToken', () => {
    it('should set reset password token for email', async () => {
      const email = 'test@example.com';
      const token = 'reset_token_123';
      const expiresAt = new Date();

      mockQuery.where.mockReturnThis();
      mockQuery.update.mockResolvedValue(1);

      const result = await User.setResetPasswordToken(email, token, expiresAt);

      expect(mockQuery.where).toHaveBeenCalledWith('email', 'test@example.com');
      expect(mockQuery.update).toHaveBeenCalledWith({
        reset_password_token: token,
        reset_password_expires: expiresAt,
        updated_at: expect.any(Date)
      });
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      const email = 'notfound@example.com';
      const token = 'reset_token_123';
      const expiresAt = new Date();

      mockQuery.where.mockReturnThis();
      mockQuery.update.mockResolvedValue(0);

      const result = await User.setResetPasswordToken(email, token, expiresAt);

      expect(result).toBe(false);
    });

    it('should normalize email case', async () => {
      const email = 'TEST@EXAMPLE.COM';
      const token = 'reset_token_123';
      const expiresAt = new Date();

      mockQuery.where.mockReturnThis();
      mockQuery.update.mockResolvedValue(1);

      await User.setResetPasswordToken(email, token, expiresAt);

      expect(mockQuery.where).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  describe('findByVerificationToken', () => {
    it('should find user by valid verification token', async () => {
      const token = 'verify_token_123';
      const userRecord = {
        id: 'user-123',
        email: 'test@example.com',
        verification_token: token,
        verification_token_expires: new Date(Date.now() + 3600000) // 1 hour from now
      };

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(userRecord);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: userRecord.id,
        email: userRecord.email
      });

      const result = await User.findByVerificationToken(token);

      expect(mockQuery.where).toHaveBeenCalledWith('verification_token', token);
      expect(mockQuery.where).toHaveBeenCalledWith('verification_token_expires', '>', expect.any(Date));
      expect(result).toEqual({
        id: userRecord.id,
        email: userRecord.email
      });
    });

    it('should return null for expired token', async () => {
      const token = 'expired_token_123';

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(null);

      const result = await User.findByVerificationToken(token);

      expect(result).toBeNull();
    });
  });

  describe('findByResetToken', () => {
    it('should find user by valid reset token', async () => {
      const token = 'reset_token_123';
      const userRecord = {
        id: 'user-123',
        email: 'test@example.com',
        reset_password_token: token,
        reset_password_expires: new Date(Date.now() + 3600000) // 1 hour from now
      };

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(userRecord);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: userRecord.id,
        email: userRecord.email
      });

      const result = await User.findByResetToken(token);

      expect(mockQuery.where).toHaveBeenCalledWith('reset_password_token', token);
      expect(mockQuery.where).toHaveBeenCalledWith('reset_password_expires', '>', expect.any(Date));
      expect(result).toEqual({
        id: userRecord.id,
        email: userRecord.email
      });
    });

    it('should return null for expired token', async () => {
      const token = 'expired_reset_token';

      mockQuery.where.mockReturnThis();
      mockQuery.first.mockResolvedValue(null);

      const result = await User.findByResetToken(token);

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile by ID', async () => {
      const userId = 'user-123';
      const userRecord = {
        id: userId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };

      (User as any).findById = jest.fn().mockResolvedValue(userRecord);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name
      });

      const result = await User.getUserProfile(userId);

      expect((User as any).findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name
      });
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent-user';

      (User as any).findById = jest.fn().mockResolvedValue(null);

      const result = await User.getUserProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      const userId = 'user-123';
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-9999',
        company: 'New Company'
      };

      const updatedRecord = {
        id: userId,
        first_name: 'Updated',
        last_name: 'Name',
        phone: '555-9999',
        company: 'New Company'
      };

      (User as any).updateById = jest.fn().mockResolvedValue(updatedRecord);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: userId,
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-9999',
        company: 'New Company'
      });

      const result = await User.updateProfile(userId, updates);

      expect((User as any).updateById).toHaveBeenCalledWith(userId, {
        first_name: 'Updated',
        last_name: 'Name',
        phone: '555-9999',
        company: 'New Company'
      });
      expect(result).toEqual({
        id: userId,
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-9999',
        company: 'New Company'
      });
    });

    it('should handle partial updates', async () => {
      const userId = 'user-123';
      const updates = {
        firstName: 'Updated'
      };

      const updatedRecord = {
        id: userId,
        first_name: 'Updated'
      };

      (User as any).updateById = jest.fn().mockResolvedValue(updatedRecord);
      (User as any).mapToUser = jest.fn().mockReturnValue({
        id: userId,
        firstName: 'Updated'
      });

      const result = await User.updateProfile(userId, updates);

      expect((User as any).updateById).toHaveBeenCalledWith(userId, {
        first_name: 'Updated'
      });
      expect(result).toEqual({
        id: userId,
        firstName: 'Updated'
      });
    });

    it('should return null when update fails', async () => {
      const userId = 'user-123';
      const updates = { firstName: 'Updated' };

      (User as any).updateById = jest.fn().mockResolvedValue(null);

      const result = await User.updateProfile(userId, updates);

      expect(result).toBeNull();
    });
  });

  describe('password security', () => {
    it('should use strong bcrypt rounds for password hashing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'test_password',
        firstName: 'Test',
        lastName: 'User'
      };

      mockBcrypt.hash.mockResolvedValue('hashed_password');
      (User as any).create = jest.fn().mockResolvedValue({});
      (User as any).mapToUser = jest.fn().mockReturnValue({});

      await User.createUser(userData);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('test_password', 12);
    });

    it('should use the same strong rounds for password updates', async () => {
      const userId = 'user-123';
      const newPassword = 'new_password';

      mockBcrypt.hash.mockResolvedValue('new_hashed_password');
      (User as any).updateById = jest.fn().mockResolvedValue({});

      await User.updatePassword(userId, newPassword);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
    });
  });
});