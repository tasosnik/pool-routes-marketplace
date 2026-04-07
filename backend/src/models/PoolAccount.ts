import { BaseModel } from './BaseModel';
import { PoolAccount as IPoolAccount, Address, AccountStatus, ServiceType, PoolType, PoolSize, ServiceFrequency } from '../types';
import { Route } from './Route';

export class PoolAccount extends BaseModel {
  protected static tableName = 'pool_accounts';

  static async findByRouteId(routeId: string): Promise<IPoolAccount[]> {
    const accounts = await this.query().where('route_id', routeId);
    return accounts.map((account: Record<string, any>) => this.mapToPoolAccount(account));
  }

  static async createAccount(accountData: {
    routeId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    address: Address;
    serviceType: ServiceType;
    frequency: ServiceFrequency;
    monthlyRate: number;
    poolType?: PoolType;
    poolSize?: PoolSize;
    equipmentNotes?: string;
    accessInstructions?: string;
    specialRequirements?: string;
    startDate: Date;
  }): Promise<IPoolAccount> {
    // Standardize coordinates as JSON string
    const coordinates = accountData.address.coordinates ?
      JSON.stringify(accountData.address.coordinates) :
      null;

    // Extract lat/lng for efficient searching
    const coordinatesLat = accountData.address.coordinates?.latitude || null;
    const coordinatesLng = accountData.address.coordinates?.longitude || null;

    const account = await this.create({
      route_id: accountData.routeId,
      customer_name: accountData.customerName,
      customer_email: accountData.customerEmail,
      customer_phone: accountData.customerPhone,
      street: accountData.address.street,
      city: accountData.address.city,
      state: accountData.address.state,
      zip_code: accountData.address.zipCode,
      country: accountData.address.country || 'USA',
      coordinates,
      coordinates_lat: coordinatesLat,
      coordinates_lng: coordinatesLng,
      service_type: accountData.serviceType,
      frequency: accountData.frequency,
      monthly_rate: accountData.monthlyRate,
      pool_type: accountData.poolType || PoolType.CHLORINE,
      pool_size: accountData.poolSize,
      equipment_notes: accountData.equipmentNotes,
      access_instructions: accountData.accessInstructions,
      special_requirements: accountData.specialRequirements,
      start_date: accountData.startDate
    });

    // Update route statistics
    await Route.updateRouteStats(accountData.routeId);

    return this.mapToPoolAccount(account);
  }

  static async createAccountInTransaction(accountData: {
    routeId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    address: Address;
    serviceType: ServiceType;
    frequency: ServiceFrequency;
    monthlyRate: number;
    poolType?: PoolType;
    poolSize?: PoolSize;
    equipmentNotes?: string;
    accessInstructions?: string;
    specialRequirements?: string;
    startDate: Date;
  }, trx: any): Promise<IPoolAccount> {
    // Standardize coordinates as JSON string
    const coordinates = accountData.address.coordinates ?
      JSON.stringify(accountData.address.coordinates) :
      null;

    // Extract lat/lng for efficient searching
    const coordinatesLat = accountData.address.coordinates?.latitude || null;
    const coordinatesLng = accountData.address.coordinates?.longitude || null;

    const [account] = await trx('pool_accounts').insert({
      route_id: accountData.routeId,
      customer_name: accountData.customerName,
      customer_email: accountData.customerEmail,
      customer_phone: accountData.customerPhone,
      street: accountData.address.street,
      city: accountData.address.city,
      state: accountData.address.state,
      zip_code: accountData.address.zipCode,
      country: accountData.address.country || 'USA',
      coordinates,
      coordinates_lat: coordinatesLat,
      coordinates_lng: coordinatesLng,
      service_type: accountData.serviceType,
      frequency: accountData.frequency,
      monthly_rate: accountData.monthlyRate,
      pool_type: accountData.poolType || PoolType.CHLORINE,
      pool_size: accountData.poolSize,
      equipment_notes: accountData.equipmentNotes,
      access_instructions: accountData.accessInstructions,
      special_requirements: accountData.specialRequirements,
      start_date: accountData.startDate,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    return this.mapToPoolAccount(account);
  }

  static async updateAccountStatus(accountId: string, status: AccountStatus, churnReason?: string): Promise<IPoolAccount | null> {
    const updateData: any = { status };

    if (status === AccountStatus.CANCELLED && churnReason) {
      updateData.churn_reason = churnReason;
      updateData.end_date = new Date();
    }

    const account = await this.updateById(accountId, updateData);
    if (!account) return null;

    // Update route statistics
    await Route.updateRouteStats(account.route_id);

    return this.mapToPoolAccount(account);
  }

  static async updateServiceDate(accountId: string, lastServiceDate: Date, nextServiceDate?: Date): Promise<boolean> {
    const updateData: any = { last_service_date: lastServiceDate };

    if (nextServiceDate) {
      updateData.next_service_date = nextServiceDate;
    } else {
      // Calculate next service date based on frequency
      const account = await this.findById(accountId);
      if (account) {
        updateData.next_service_date = this.calculateNextServiceDate(lastServiceDate, account.frequency);
      }
    }

    const result = await this.updateById(accountId, updateData);
    return !!result;
  }

  static async getAccountsNeedingService(routeId?: string, daysAhead: number = 7): Promise<IPoolAccount[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    let query = this.query()
      .where('status', AccountStatus.ACTIVE)
      .where('next_service_date', '<=', targetDate);

    if (routeId) {
      query = query.where('route_id', routeId);
    }

    const accounts = await query.orderBy('next_service_date', 'asc');
    return accounts.map((account: Record<string, any>) => this.mapToPoolAccount(account));
  }

  static async searchAccounts(filters: {
    routeId?: string;
    customerName?: string;
    status?: AccountStatus;
    serviceType?: ServiceType;
    location?: { latitude: number; longitude: number };
    radiusInMiles?: number;
  }): Promise<IPoolAccount[]> {
    let query = this.query();

    if (filters.routeId) {
      query = query.where('route_id', filters.routeId);
    }

    if (filters.customerName) {
      query = query.where('customer_name', 'ilike', `%${filters.customerName}%`);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.serviceType) {
      query = query.where('service_type', filters.serviceType);
    }

    if (filters.location && filters.radiusInMiles) {
      // Use Haversine formula for distance calculation without PostGIS
      query = query.whereRaw(
        `(
          6371 * acos(
            cos(radians(?)) * cos(radians(coordinates_lat)) *
            cos(radians(coordinates_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(coordinates_lat))
          )
        ) <= ?`,
        [
          filters.location.latitude,
          filters.location.longitude,
          filters.location.latitude,
          filters.radiusInMiles / 0.621371 // Convert miles to kilometers for Haversine
        ]
      );
    }

    const accounts = await query.orderBy('customer_name', 'asc');
    return accounts.map((account: Record<string, any>) => this.mapToPoolAccount(account));
  }

  static async bulkCreateAccounts(routeId: string, accountsData: Partial<IPoolAccount>[]): Promise<IPoolAccount[]> {
    const results: IPoolAccount[] = [];

    for (const accountData of accountsData) {
      if (!accountData.customerName || !accountData.address || !accountData.serviceType || !accountData.monthlyRate) {
        continue; // Skip invalid accounts
      }

      try {
        const account = await this.createAccount({
          routeId,
          customerName: accountData.customerName,
          customerEmail: accountData.customerEmail,
          customerPhone: accountData.customerPhone,
          address: accountData.address,
          serviceType: accountData.serviceType,
          frequency: accountData.frequency || ServiceFrequency.WEEKLY,
          monthlyRate: accountData.monthlyRate,
          poolType: accountData.poolType,
          poolSize: accountData.poolSize,
          equipmentNotes: accountData.equipmentNotes,
          accessInstructions: accountData.accessInstructions,
          specialRequirements: accountData.specialRequirements,
          startDate: accountData.startDate || new Date()
        });

        results.push(account);
      } catch (error) {
        console.error('Error creating account:', error);
        // Continue with other accounts
      }
    }

    return results;
  }

  // Helper method to calculate next service date
  private static calculateNextServiceDate(lastServiceDate: Date, frequency: ServiceFrequency): Date {
    const nextDate = new Date(lastServiceDate);

    switch (frequency) {
      case ServiceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case ServiceFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case ServiceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  // Map database record to PoolAccount interface
  private static mapToPoolAccount(dbAccount: Record<string, any>): IPoolAccount {
    const address: Address = {
      street: dbAccount.street,
      city: dbAccount.city,
      state: dbAccount.state,
      zipCode: dbAccount.zip_code,
      country: dbAccount.country,
      coordinates: this.extractCoordinates(dbAccount)
    };

    return {
      id: dbAccount.id,
      routeId: dbAccount.route_id,
      customerName: dbAccount.customer_name,
      customerEmail: dbAccount.customer_email,
      customerPhone: dbAccount.customer_phone,
      address,
      serviceType: dbAccount.service_type,
      frequency: dbAccount.frequency,
      monthlyRate: parseFloat(dbAccount.monthly_rate),
      lastServiceDate: dbAccount.last_service_date,
      nextServiceDate: dbAccount.next_service_date,
      poolType: dbAccount.pool_type,
      poolSize: dbAccount.pool_size,
      equipmentNotes: dbAccount.equipment_notes,
      accessInstructions: dbAccount.access_instructions,
      specialRequirements: dbAccount.special_requirements,
      status: dbAccount.status,
      startDate: dbAccount.start_date,
      endDate: dbAccount.end_date,
      churnReason: dbAccount.churn_reason,
      createdAt: dbAccount.created_at,
      updatedAt: dbAccount.updated_at
    };
  }

  private static extractCoordinates(dbAccount: Record<string, any>): { latitude: number; longitude: number } | undefined {
    // Use computed lat/lng columns if available and valid
    if (dbAccount.coordinates_lat != null && dbAccount.coordinates_lng != null) {
      const lat = parseFloat(dbAccount.coordinates_lat);
      const lng = parseFloat(dbAccount.coordinates_lng);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return { latitude: lat, longitude: lng };
      }
    }

    // Fall back to JSON coordinates column
    if (dbAccount.coordinates) {
      try {
        const parsed = typeof dbAccount.coordinates === 'string'
          ? JSON.parse(dbAccount.coordinates)
          : dbAccount.coordinates;
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return parsed;
        }
      } catch (error) {
        console.error('Error parsing coordinates JSON:', error);
      }
    }

    return undefined;
  }
}