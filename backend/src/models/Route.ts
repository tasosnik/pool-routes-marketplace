import { BaseModel } from './BaseModel';
import { Route as IRoute, RouteStatus, ServiceArea, Coordinates } from '@shared/types';

export class Route extends BaseModel {
  protected static tableName = 'routes';

  static async findByOwnerId(ownerId: string): Promise<IRoute[]> {
    const routes = await this.query().where('owner_id', ownerId);
    return routes.map(route => this.mapToRoute(route));
  }

  static async createRoute(routeData: {
    ownerId: string;
    name: string;
    description?: string;
    serviceArea: ServiceArea;
  }): Promise<IRoute> {
    // Convert coordinates to PostGIS format
    const boundaries = this.coordinatesToPostGIS(routeData.serviceArea.boundaries);
    const centerPoint = this.pointToPostGIS(routeData.serviceArea.centerPoint);

    const route = await this.create({
      owner_id: routeData.ownerId,
      name: routeData.name,
      description: routeData.description,
      service_area_name: routeData.serviceArea.name,
      service_area_boundaries: boundaries,
      service_area_center: centerPoint,
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
      // Use PostGIS for spatial filtering
      const point = this.pointToPostGIS(filters.location);
      query = query.whereRaw(
        'ST_DWithin(service_area_center, ST_GeogFromText(?), ?)',
        [point, filters.radiusInMiles * 1609.34] // Convert miles to meters
      );
    }

    const routes = await query.orderBy('monthly_revenue', 'desc');
    return routes.map(route => this.mapToRoute(route));
  }

  static async getRouteWithAccounts(routeId: string): Promise<IRoute | null> {
    const route = await this.findById(routeId);
    if (!route) return null;

    // Get associated accounts (will be implemented in PoolAccount model)
    const mappedRoute = this.mapToRoute(route);
    mappedRoute.accounts = []; // Will be populated by PoolAccount.findByRouteId()

    return mappedRoute;
  }

  // Helper methods for PostGIS conversion
  private static coordinatesToPostGIS(coordinates: Coordinates[]): string {
    const points = coordinates.map(coord => `${coord.longitude} ${coord.latitude}`).join(',');
    return `POLYGON((${points}))`;
  }

  private static pointToPostGIS(coord: Coordinates): string {
    return `POINT(${coord.longitude} ${coord.latitude})`;
  }

  private static postGISToCoordinates(postgisPolygon: string): Coordinates[] {
    // Parse PostGIS POLYGON to coordinates array
    // This is a simplified parser - in production, use a proper PostGIS library
    const match = postgisPolygon.match(/POLYGON\(\((.+)\)\)/);
    if (!match) return [];

    return match[1].split(',').map(point => {
      const [lng, lat] = point.trim().split(' ');
      return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
    });
  }

  private static postGISToPoint(postgisPoint: string): Coordinates {
    // Parse PostGIS POINT to coordinate
    const match = postgisPoint.match(/POINT\((.+) (.+)\)/);
    if (!match) return { latitude: 0, longitude: 0 };

    return {
      latitude: parseFloat(match[2]),
      longitude: parseFloat(match[1])
    };
  }

  // Map database record to Route interface
  private static mapToRoute(dbRoute: any): IRoute {
    const serviceArea: ServiceArea = {
      name: dbRoute.service_area_name,
      boundaries: dbRoute.service_area_boundaries ?
        this.postGISToCoordinates(dbRoute.service_area_boundaries) : [],
      centerPoint: dbRoute.service_area_center ?
        this.postGISToPoint(dbRoute.service_area_center) : { latitude: 0, longitude: 0 },
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