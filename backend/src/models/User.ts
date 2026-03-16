import { BaseModel } from './BaseModel';
import { User as IUser, UserRole } from '@shared/types';
import bcrypt from 'bcryptjs';

export class User extends BaseModel {
  protected static tableName = 'users';

  static async findByEmail(email: string): Promise<IUser | null> {
    const result = await this.query().where('email', email.toLowerCase()).first();
    return result || null;
  }

  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    role?: UserRole;
  }): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await this.create({
      email: userData.email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      company: userData.company,
      role: userData.role || UserRole.OPERATOR
    });

    // Remove password hash from response
    delete user.password_hash;
    return this.mapToUser(user);
  }

  static async validatePassword(email: string, password: string): Promise<IUser | null> {
    const user = await this.query()
      .where('email', email.toLowerCase())
      .first();

    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return null;

    delete user.password_hash;
    return this.mapToUser(user);
  }

  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await this.updateById(userId, {
      password_hash: hashedPassword
    });
    return !!result;
  }

  static async verifyEmail(userId: string): Promise<boolean> {
    const result = await this.updateById(userId, {
      email_verified: true,
      verification_token: null,
      verification_token_expires: null
    });
    return !!result;
  }

  static async setVerificationToken(userId: string, token: string, expiresAt: Date): Promise<boolean> {
    const result = await this.updateById(userId, {
      verification_token: token,
      verification_token_expires: expiresAt
    });
    return !!result;
  }

  static async setResetPasswordToken(email: string, token: string, expiresAt: Date): Promise<boolean> {
    const result = await this.query()
      .where('email', email.toLowerCase())
      .update({
        reset_password_token: token,
        reset_password_expires: expiresAt,
        updated_at: new Date()
      });
    return result > 0;
  }

  static async findByVerificationToken(token: string): Promise<IUser | null> {
    const result = await this.query()
      .where('verification_token', token)
      .where('verification_token_expires', '>', new Date())
      .first();

    if (!result) return null;
    return this.mapToUser(result);
  }

  static async findByResetToken(token: string): Promise<IUser | null> {
    const result = await this.query()
      .where('reset_password_token', token)
      .where('reset_password_expires', '>', new Date())
      .first();

    if (!result) return null;
    return this.mapToUser(result);
  }

  // Map database record to User interface
  private static mapToUser(dbUser: any): IUser {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      company: dbUser.company,
      role: dbUser.role,
      emailVerified: dbUser.email_verified,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }

  static async getUserProfile(userId: string): Promise<IUser | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    return this.mapToUser(user);
  }

  static async updateProfile(userId: string, updates: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
  }>): Promise<IUser | null> {
    const updateData: any = {};

    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName) updateData.last_name = updates.lastName;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.company) updateData.company = updates.company;

    const updatedUser = await this.updateById(userId, updateData);
    if (!updatedUser) return null;

    return this.mapToUser(updatedUser);
  }
}