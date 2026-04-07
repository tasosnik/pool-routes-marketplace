import { BaseModel } from './BaseModel';
import { Route as IRoute, RouteStatus, ServiceArea, Coordinates } from '../types';

export class Route extends BaseModel {
  protected static tableName = 'routes';

  static async findByOwnerId(ownerId: string): Promise<IRoute[]> {
    const routes = await this.query().where('owner_id', ownerId);
    return routes.map((route: Record<string, any>) => this.mapToRoute(route));
  }

  static async createRoute(routeData: {
    ownerId: string;
    name: string;
    description?: string;
    serviceArea: ServiceArea;
  }): Promise<IRoute> {
    // Standardize coordinates as JSON strings
    const boundaries = JSON.stringify(routeData.serviceArea.boundaries);
    const centerPoint = JSON.stringify(routeData.serviceArea.centerPoint);

    // Extract lat/lng for efficient searching
    const centerLat = routeData.serviceArea.centerPoint.latitude;
    const centerLng = routeData.serviceArea.centerPoint.longitude;

    const route = await this.create({
      owner_id: routeData.ownerId,
      name: routeData.name,
      description: routeData.description,
      service_area_name: routeData.serviceArea.name,
      service_area_boundaries: boundaries,
      service_area_center: centerPoint,
      service_area_center_lat: centerLat,
      service_area_center_lng: centerLng,
      service_area_radius: routeData.serviceArea.radius
    });

    return this.mapToRoute(route);
  }

  static async updateRouteStats(routeId: string): Promise<void> {
    // Calculate and update route statistics based on associated accounts
    const stats = await this.raw(`
      SELECT
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
        COALESCE(SUM(CASE WHEN status = 'active' THEN monthly_rate ELSE 0 END), 0) as monthly_revenue,
        COALESCE(AVG(CASE WHEN status = 'active' THEN monthly_rate END), 0) as average_rate
      FROM pool_accounts
      WHERE route_id = ?
    `, [routeId]);

    const { total_accounts, active_accounts, monthly_revenue, average_rate } = stats.rows[0];

    await this.updateById(routeId, {
      total_accounts: parseInt(total_accounts),
      active_accounts: parseInt(active_accounts),
      monthly_revenue: parseFloat(monthly_revenue),
      average_rate: parseFloat(average_rate)
    });
  }

  static async setForSale(routeId: string, askingPrice: number): Promise<boolean> {
    const result = await this.updateById(routeId, {
      is_for_sale: true,
      asking_price: askingPrice,
      status: RouteStatus.FOR_SALE
    });
    return !!result;
  }

  static async removeFromSale(routeId: string): Promise<boolean> {
    const result = await this.updateById(routeId, {
      is_for_sale: false,
      asking_price: null,
      status: RouteStatus.ACTIVE
    });
    return !!result;
  }

  static async findRoutesForSale(filters?: {
    minRevenue?: number;
    maxPrice?: number;
    location?: Coordinates;
    radiusInMiles?: number;
  }): Promise<IRoute[]> {
    let query = this.query()
      .where('is_for_sale', true)
      .where('status', RouteStatus.FOR_SALE);

    if (filters?.minRevenue) {
      query = query.where('monthly_revenue', '>=', filters.minRevenue);
    }

    if (filters?.maxPrice) {
      query = query.where('asking_price', '<=', filters.maxPrice);
    }

    if (filters?.location && filters?.radiusInMiles) {
      // Use Haversine formula for distance calculation without PostGIS
      query = query.whereRaw(
        `(
          6371 * acos(
            cos(radians(?)) * cos(radians(service_area_center_lat)) *
            cos(radians(service_area_center_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(service_area_center_lat))
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

    const routes = await query.orderBy('monthly_revenue', 'desc');
    return routes.map((route: Record<string, any>) => this.mapToRoute(route));
  }

  static async getRouteWithAccounts(routeId: string): Promise<IRoute | null> {
    const route = await this.findById(routeId);
    if (!route) return null;

    const mappedRoute = this.mapToRoute(route);
    // Use dynamic require to avoid circular dependency (PoolAccount -> Route -> PoolAccount)
    const { PoolAccount } = await import('./PoolAccount');
    mappedRoute.accounts = await PoolAccount.findByRouteId(routeId);

    return mappedRoute;
  }


  private static extractBoundaries(dbRoute: Record<string, any>): Coordinates[] {
    // Parse JSON boundaries column
    if (dbRoute.service_area_boundaries) {
      try {
        if (typeof dbRoute.service_area_boundaries === 'string') {
          const parsed = JSON.parse(dbRoute.service_area_boundaries);
          return Array.isArray(parsed) ? parsed : [];
        }
        return Array.isArray(dbRoute.service_area_boundaries) ? dbRoute.service_area_boundaries : [];
      } catch (error) {
        console.error('Error parsing boundaries JSON:', error);
      }
    }

    return [];
  }

  private static extractCenterPoint(dbRoute: Record<string, any>): Coordinates {
    // Use computed lat/lng columns if available
    if (dbRoute.service_area_center_lat !== null && dbRoute.service_area_center_lng !== null) {
      return {
        latitude: parseFloat(dbRoute.service_area_center_lat),
        longitude: parseFloat(dbRoute.service_area_center_lng)
      };
    }

    // Fall back to JSON center column
    if (dbRoute.service_area_center) {
      try {
        if (typeof dbRoute.service_area_center === 'string') {
          const parsed = JSON.parse(dbRoute.service_area_center);
          return parsed;
        }
        return dbRoute.service_area_center;
      } catch (error) {
        console.error('Error parsing center point JSON:', error);
      }
    }

    return { latitude: 0, longitude: 0 };
  }

  // Map database record to Route interface
  private static mapToRoute(dbRoute: Record<string, any>): IRoute {
    const serviceArea: ServiceArea = {
      name: dbRoute.service_area_name,
      boundaries: this.extractBoundaries(dbRoute),
      centerPoint: this.extractCenterPoint(dbRoute),
      radius: dbRoute.service_area_radius
    };

    return {
      id: dbRoute.id,
      ownerId: dbRoute.owner_id,
      name: dbRoute.name,
      description: dbRoute.description,
      serviceArea,
      accounts: [], // Will be populated separately
      totalAccounts: dbRoute.total_accounts,
      activeAccounts: dbRoute.active_accounts,
      monthlyRevenue: parseFloat(dbRoute.monthly_revenue),
      averageRate: parseFloat(dbRoute.average_rate),
      isForSale: dbRoute.is_for_sale,
      askingPrice: dbRoute.asking_price ? parseFloat(dbRoute.asking_price) : undefined,
      status: dbRoute.status,
      createdAt: dbRoute.created_at,
      updatedAt: dbRoute.updated_at
    };
  }
}