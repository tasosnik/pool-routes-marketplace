import { BaseModel } from './BaseModel';
import { RouteListing as IRouteListing, ListingStatus, Coordinates } from '../types';

export class RouteListing extends BaseModel {
  protected static tableName = 'route_listings';

  static async findByStatus(status: ListingStatus): Promise<IRouteListing[]> {
    const listings = await this.query()
      .select(
        'route_listings.*',
        'routes.name as route_name',
        'routes.service_area_name',
        'routes.service_area_center_lat',
        'routes.service_area_center_lng',
        'users.first_name as seller_first_name',
        'users.last_name as seller_last_name',
        'users.email as seller_email',
        'users.company as seller_company'
      )
      .leftJoin('routes', 'route_listings.route_id', 'routes.id')
      .leftJoin('users', 'route_listings.seller_id', 'users.id')
      .where('route_listings.status', status)
      .orderBy('route_listings.listed_at', 'desc');

    return listings.map((listing: any) => this.mapToListing(listing));
  }

  static async findActiveListings(filters?: {
    minRevenue?: number;
    maxPrice?: number;
    location?: Coordinates;
    locationName?: string;
    radiusInMiles?: number;
    minMultiple?: number;
    maxMultiple?: number;
  }): Promise<IRouteListing[]> {
    let query = this.query()
      .select(
        'route_listings.*',
        'routes.name as route_name',
        'routes.service_area_name',
        'routes.service_area_center_lat',
        'routes.service_area_center_lng',
        'users.first_name as seller_first_name',
        'users.last_name as seller_last_name',
        'users.email as seller_email',
        'users.company as seller_company'
      )
      .leftJoin('routes', 'route_listings.route_id', 'routes.id')
      .leftJoin('users', 'route_listings.seller_id', 'users.id')
      .where('route_listings.status', ListingStatus.ACTIVE);

    if (filters?.minRevenue) {
      query = query.where('route_listings.monthly_revenue', '>=', filters.minRevenue);
    }

    if (filters?.maxPrice) {
      query = query.where('route_listings.asking_price', '<=', filters.maxPrice);
    }

    if (filters?.minMultiple) {
      query = query.where('route_listings.revenue_multiple', '>=', filters.minMultiple);
    }

    if (filters?.maxMultiple) {
      query = query.where('route_listings.revenue_multiple', '<=', filters.maxMultiple);
    }

    if (filters?.locationName) {
      query = query.whereRaw(
        `routes.service_area_name ILIKE ?`,
        [`%${filters.locationName}%`]
      );
    }

    if (filters?.location && filters?.radiusInMiles) {
      // Use Haversine formula for distance calculation
      query = query.whereRaw(
        `(
          6371 * acos(
            cos(radians(?)) * cos(radians(routes.service_area_center_lat)) *
            cos(radians(routes.service_area_center_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(routes.service_area_center_lat))
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

    const listings = await query.orderBy('route_listings.listed_at', 'desc');
    return listings.map((listing: any) => this.mapToListing(listing));
  }

  static async findBySellerId(sellerId: string): Promise<IRouteListing[]> {
    const listings = await this.query()
      .select(
        'route_listings.*',
        'routes.name as route_name',
        'routes.service_area_name'
      )
      .leftJoin('routes', 'route_listings.route_id', 'routes.id')
      .where('route_listings.seller_id', sellerId)
      .orderBy('route_listings.created_at', 'desc');

    return listings.map((listing: any) => this.mapToListing(listing));
  }

  static async createListing(listingData: {
    routeId: string;
    sellerId: string;
    title: string;
    description: string;
    askingPrice: number;
    accountCount: number;
    monthlyRevenue: number;
    retentionRate: number;
    averageAccountAge: number;
    equipmentIncluded?: boolean;
    customerTransition?: boolean;
    escrowPeriod?: number;
    retentionGuaranteePercentage?: number;
    retentionGuaranteePeriod?: number;
    retentionPenaltyRate?: number;
    images?: string[];
    documents?: string[];
  }): Promise<IRouteListing> {
    // Calculate revenue multiple
    const revenueMultiple = listingData.askingPrice / listingData.monthlyRevenue;

    const listing = await this.create({
      route_id: listingData.routeId,
      seller_id: listingData.sellerId,
      title: listingData.title,
      description: listingData.description,
      asking_price: listingData.askingPrice,
      account_count: listingData.accountCount,
      monthly_revenue: listingData.monthlyRevenue,
      revenue_multiple: revenueMultiple,
      retention_rate: listingData.retentionRate,
      average_account_age: listingData.averageAccountAge,
      equipment_included: listingData.equipmentIncluded || false,
      customer_transition: listingData.customerTransition || false,
      escrow_period: listingData.escrowPeriod || 30,
      retention_guarantee_percentage: listingData.retentionGuaranteePercentage || 90,
      retention_guarantee_period: listingData.retentionGuaranteePeriod || 90,
      retention_penalty_rate: listingData.retentionPenaltyRate || 10,
      images: listingData.images ? JSON.stringify(listingData.images) : null,
      documents: listingData.documents ? JSON.stringify(listingData.documents) : null,
      status: ListingStatus.DRAFT
    });

    return this.mapToListing(listing);
  }

  static async publishListing(listingId: string): Promise<boolean> {
    const result = await this.updateById(listingId, {
      status: ListingStatus.ACTIVE,
      listed_at: new Date()
    });
    return !!result;
  }

  static async withdrawListing(listingId: string): Promise<boolean> {
    const result = await this.updateById(listingId, {
      status: ListingStatus.WITHDRAWN
    });
    return !!result;
  }

  static async updateListingStatus(listingId: string, status: ListingStatus): Promise<boolean> {
    const updateData: any = { status };

    if (status === ListingStatus.ACTIVE && !await this.hasListedDate(listingId)) {
      updateData.listed_at = new Date();
    }

    const result = await this.updateById(listingId, updateData);
    return !!result;
  }

  static async getDetailedListing(listingId: string): Promise<IRouteListing | null> {
    const listing = await this.query()
      .select(
        'route_listings.*',
        'routes.name as route_name',
        'routes.service_area_name',
        'routes.service_area_center_lat',
        'routes.service_area_center_lng',
        'users.first_name as seller_first_name',
        'users.last_name as seller_last_name',
        'users.email as seller_email',
        'users.company as seller_company'
      )
      .leftJoin('routes', 'route_listings.route_id', 'routes.id')
      .leftJoin('users', 'route_listings.seller_id', 'users.id')
      .where('route_listings.id', listingId)
      .first();

    if (!listing) return null;

    return this.mapToDetailedListing(listing);
  }

  private static async hasListedDate(listingId: string): Promise<boolean> {
    const result = await this.query()
      .select('listed_at')
      .where('id', listingId)
      .first();

    return !!result?.listed_at;
  }

  // Map database record to RouteListing interface
  private static mapToListing(dbListing: Record<string, any>): any {
    const listing: any = {
      id: dbListing.id,
      routeId: dbListing.route_id,
      sellerId: dbListing.seller_id,
      title: dbListing.title,
      description: dbListing.description,
      askingPrice: parseFloat(dbListing.asking_price),
      accountCount: dbListing.account_count,
      monthlyRevenue: parseFloat(dbListing.monthly_revenue),
      revenueMultiple: parseFloat(dbListing.revenue_multiple),
      retentionRate: parseFloat(dbListing.retention_rate),
      averageAccountAge: dbListing.average_account_age,
      equipmentIncluded: dbListing.equipment_included,
      customerTransition: dbListing.customer_transition,
      escrowPeriod: dbListing.escrow_period,
      retentionGuaranteePercentage: parseFloat(dbListing.retention_guarantee_percentage),
      retentionGuaranteePeriod: dbListing.retention_guarantee_period,
      retentionPenaltyRate: parseFloat(dbListing.retention_penalty_rate),
      images: dbListing.images ? JSON.parse(dbListing.images) : [],
      documents: dbListing.documents ? JSON.parse(dbListing.documents) : [],
      status: dbListing.status,
      listedAt: dbListing.listed_at,
      createdAt: dbListing.created_at,
      updatedAt: dbListing.updated_at,
      // Include basic route info if joined
      route: dbListing.route_name ? {
        name: dbListing.route_name,
        serviceAreaName: dbListing.service_area_name,
        centerLat: dbListing.service_area_center_lat,
        centerLng: dbListing.service_area_center_lng
      } : undefined,
      // Include basic seller info if joined
      seller: dbListing.seller_first_name ? {
        firstName: dbListing.seller_first_name,
        lastName: dbListing.seller_last_name,
        email: dbListing.seller_email,
        company: dbListing.seller_company
      } : undefined
    };

    return listing;
  }

  // Map detailed database record with full route and seller data
  private static mapToDetailedListing(dbListing: Record<string, any>): any {
    const baseListing = this.mapToListing(dbListing);

    // Route details already populated by mapToListing via route_name alias

    return baseListing;
  }
}