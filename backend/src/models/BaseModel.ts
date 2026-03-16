import { db } from '../config/database';
import { Knex } from 'knex';

export abstract class BaseModel {
  protected static tableName: string;

  // Get table name for the model
  static getTableName(): string {
    if (!this.tableName) {
      throw new Error(`Table name not defined for ${this.name}`);
    }
    return this.tableName;
  }

  // Get query builder for the table
  static query(): Knex.QueryBuilder {
    return db(this.getTableName());
  }

  // Find by ID
  static async findById(id: string): Promise<any | null> {
    const result = await this.query().where('id', id).first();
    return result || null;
  }

  // Find by multiple criteria
  static async findBy(criteria: Record<string, any>): Promise<any[]> {
    return this.query().where(criteria);
  }

  // Find one by criteria
  static async findOneBy(criteria: Record<string, any>): Promise<any | null> {
    const result = await this.query().where(criteria).first();
    return result || null;
  }

  // Create new record
  static async create(data: Record<string, any>): Promise<any> {
    const [result] = await this.query().insert(data).returning('*');
    return result;
  }

  // Update by ID
  static async updateById(id: string, data: Record<string, any>): Promise<any | null> {
    const [result] = await this.query()
      .where('id', id)
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return result || null;
  }

  // Delete by ID
  static async deleteById(id: string): Promise<boolean> {
    const deletedCount = await this.query().where('id', id).del();
    return deletedCount > 0;
  }

  // Get all records
  static async findAll(limit?: number, offset?: number): Promise<any[]> {
    let query = this.query();

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return query;
  }

  // Count records
  static async count(where?: Record<string, any>): Promise<number> {
    let query = this.query().count('* as count');

    if (where) {
      query = query.where(where);
    }

    const result = await query.first();
    return parseInt(result?.count as string) || 0;
  }

  // Execute transaction
  static async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return db.transaction(callback);
  }

  // Raw query
  static async raw(query: string, bindings?: any[]): Promise<any> {
    return db.raw(query, bindings);
  }
}