import { Request, Response } from 'express';
import Joi from 'joi';
import { RouteListing } from '../models/RouteListing';
import { Route } from '../models/Route';
import { PoolAccount } from '../models/PoolAccount';
import { UserRole, ListingStatus } from '../types';
import { ApiResponse, PaginatedResponse } from '../types';

// Validation schemas
const createListingSchema = Joi.object({
  routeId: Joi.string().uuid().required(),
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  askingPrice: Joi.number().min(1000).max(10000000).required(),
  accountCount: Joi.number().integer().min(1).required(),
  monthlyRevenue: Joi.number().min(100).required(),
  retentionRate: Joi.number().min(0).max(100).required(),
  averageAccountAge: Joi.number().integer().min(1).required(),
  equipmentIncluded: Joi.boolean().default(false),
  customerTransition: Joi.boolean().default(false),
  escrowPeriod: Joi.number().integer().min(7).max(180).default(30),
  retentionGuaranteePercentage: Joi.number().min(50).max(100).default(90),
  retentionGuaranteePeriod: Joi.number().integer().min(30).max(365).default(90),
  retentionPenaltyRate: Joi.number().min(0).max(50).default(10),
  images: Joi.array().items(Joi.string().uri()).max(10).optional(),
  documents: Joi.array().items(Joi.string().uri()).max(5).optional()
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().min(10).max(2000).optional(),
  askingPrice: Joi.number().min(1000).max(10000000).optional(),
  accountCount: Joi.number().integer().min(1).optional(),
  monthlyRevenue: Joi.number().min(100).optional(),
  retentionRate: Joi.number().min(0).max(100).optional(),
  averageAccountAge: Joi.number().integer().min(1).optional(),
  equipmentIncluded: Joi.boolean().optional(),
  customerTransition: Joi.boolean().optional(),
  escrowPeriod: Joi.number().integer().min(7).max(180).optional(),
  retentionGuaranteePercentage: Joi.number().min(50).max(100).optional(),
  retentionGuaranteePeriod: Joi.number().integer().min(30).max(365).optional(),
  retentionPenaltyRate: Joi.number().min(0).max(50).optional(),
  images: Joi.array().items(Joi.string().uri()).max(10).optional(),
  documents: Joi.array().items(Joi.string().uri()).max(5).optional()
});

const filtersSchema = Joi.object({
  minRevenue: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minMultiple: Joi.number().min(0).optional(),
  maxMultiple: Joi.number().min(0).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  radiusInMiles: Joi.number().min(1).max(1000).optional(),
  location: Joi.string().trim().max(200).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export class MarketplaceController {
  /**
   * GET /api/marketplace
   * Get marketplace listings with optional filters
   */
  static async getListings(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = filtersSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid filter parameters',
          details: error.details[0].message
        });
        return;
      }

      const {
        minRevenue,
        maxPrice,
        minMultiple,
        maxMultiple,
        latitude,
        longitude,
        radiusInMiles,
        location,
        page,
        limit
      } = value;

      // Build filter object
      const filters: any = {};
      if (minRevenue) filters.minRevenue = minRevenue;
      if (maxPrice) filters.maxPrice = maxPrice;
      if (minMultiple) filters.minMultiple = minMultiple;
      if (maxMultiple) filters.maxMultiple = maxMultiple;
      if (location) filters.locationName = location;

      if (latitude && longitude && radiusInMiles) {
        filters.location = { latitude, longitude };
        filters.radiusInMiles = radiusInMiles;
      }

      // Get active listings
      let listings = await RouteListing.findActiveListings(filters);

      // Strip seller email for unauthenticated requests
      if (!req.user) {
        listings = listings.map((listing: any) => {
          if (listing.seller) {
            const { email, ...sellerWithoutEmail } = listing.seller;
            return { ...listing, seller: sellerWithoutEmail };
          }
          return listing;
        });
      }

      // Apply pagination
      const total = listings.length;
      const offset = (page - 1) * limit;
      listings = listings.slice(offset, offset + limit);

      const response: PaginatedResponse = {
        data: listings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      res.json({
        success: true,
        ...response
      });
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch marketplace listings'
      });
    }
  }

  /**
   * GET /api/marketplace/:id
   * Get a specific listing with detailed information
   */
  static async getListing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const listing = await RouteListing.getDetailedListing(id);

      if (!listing) {
        res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
        return;
      }

      // Only show active listings to non-owners/non-admins
      if (
        listing.status !== ListingStatus.ACTIVE &&
        req.user?.role !== UserRole.ADMIN &&
        listing.sellerId !== req.user?.id
      ) {
        res.status(403).json({
          success: false,
          error: 'Listing not available'
        });
        return;
      }

      // Fetch accounts for the listing's route to show on map
      let accounts: any[] = [];
      if (listing.routeId) {
        try {
          accounts = await PoolAccount.findByRouteId(listing.routeId);
        } catch {
          // Non-critical — map will just show approximate area
        }
      }

      // Strip seller email for unauthenticated requests
      let listingData: any = { ...listing, accounts };
      if (!req.user && listing.seller) {
        const { email, ...sellerWithoutEmail } = listing.seller as any;
        listingData = { ...listingData, seller: sellerWithoutEmail };
      }

      res.json({
        success: true,
        data: listingData
      });
    } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch listing'
      });
    }
  }

  /**
   * POST /api/marketplace
   * Create a new marketplace listing
   */
  static async createListing(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createListingSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details[0].message
        });
        return;
      }

      const { routeId, ...listingData } = value;

      // Verify route exists and user owns it
      const route = await Route.findById(routeId);
      if (!route) {
        res.status(404).json({
          success: false,
          error: 'Route not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && route.owner_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'You can only list routes you own'
        });
        return;
      }

      // Check if route is already listed
      const existingListings = await RouteListing.findBy({
        route_id: routeId
      });

      const activeStatuses = [ListingStatus.ACTIVE, ListingStatus.PENDING, ListingStatus.IN_ESCROW];
      const existingListing = existingListings.find(listing => activeStatuses.includes(listing.status));

      if (existingListing) {
        res.status(409).json({
          success: false,
          error: 'Route is already listed in the marketplace'
        });
        return;
      }

      // Create the listing
      const listing = await RouteListing.createListing({
        routeId,
        sellerId: req.user?.id || '',
        ...listingData
      });

      res.status(201).json({
        success: true,
        data: listing,
        message: 'Listing created successfully'
      });
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create listing'
      });
    }
  }

  /**
   * PUT /api/marketplace/:id
   * Update an existing listing
   */
  static async updateListing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate request body
      const { error, value } = updateListingSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details[0].message
        });
        return;
      }

      // Check if listing exists and user has access
      const existingListing = await RouteListing.findById(id);
      if (!existingListing) {
        res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingListing.seller_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Check if listing can be edited
      if (existingListing.status === ListingStatus.IN_ESCROW || existingListing.status === ListingStatus.SOLD) {
        res.status(409).json({
          success: false,
          error: 'Cannot edit listing that is in escrow or sold'
        });
        return;
      }

      // Prepare update data
      const updateData: any = {};

      if (value.title) updateData.title = value.title;
      if (value.description) updateData.description = value.description;
      if (value.askingPrice) {
        updateData.asking_price = value.askingPrice;
        // Recalculate revenue multiple if price changes
        if (value.monthlyRevenue || existingListing.monthly_revenue) {
          const monthlyRevenue = value.monthlyRevenue || existingListing.monthly_revenue;
          updateData.revenue_multiple = value.askingPrice / monthlyRevenue;
        }
      }
      if (value.accountCount) updateData.account_count = value.accountCount;
      if (value.monthlyRevenue) {
        updateData.monthly_revenue = value.monthlyRevenue;
        // Recalculate revenue multiple if revenue changes
        const askingPrice = value.askingPrice || existingListing.asking_price;
        updateData.revenue_multiple = askingPrice / value.monthlyRevenue;
      }
      if (value.retentionRate) updateData.retention_rate = value.retentionRate;
      if (value.averageAccountAge) updateData.average_account_age = value.averageAccountAge;
      if (value.equipmentIncluded !== undefined) updateData.equipment_included = value.equipmentIncluded;
      if (value.customerTransition !== undefined) updateData.customer_transition = value.customerTransition;
      if (value.escrowPeriod) updateData.escrow_period = value.escrowPeriod;
      if (value.retentionGuaranteePercentage) updateData.retention_guarantee_percentage = value.retentionGuaranteePercentage;
      if (value.retentionGuaranteePeriod) updateData.retention_guarantee_period = value.retentionGuaranteePeriod;
      if (value.retentionPenaltyRate) updateData.retention_penalty_rate = value.retentionPenaltyRate;
      if (value.images) updateData.images = JSON.stringify(value.images);
      if (value.documents) updateData.documents = JSON.stringify(value.documents);

      // Update listing
      const updatedListing = await RouteListing.updateById(id, updateData);

      if (!updatedListing) {
        res.status(500).json({
          success: false,
          error: 'Failed to update listing'
        });
        return;
      }

      // Fetch updated listing with details
      const listing = await RouteListing.getDetailedListing(id);

      res.json({
        success: true,
        data: listing,
        message: 'Listing updated successfully'
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update listing'
      });
    }
  }

  /**
   * DELETE /api/marketplace/:id
   * Delete a listing (soft delete by setting status to withdrawn)
   */
  static async deleteListing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if listing exists and user has access
      const existingListing = await RouteListing.findById(id);
      if (!existingListing) {
        res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingListing.seller_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Check if listing can be deleted
      if (existingListing.status === ListingStatus.IN_ESCROW || existingListing.status === ListingStatus.SOLD) {
        res.status(409).json({
          success: false,
          error: 'Cannot delete listing that is in escrow or sold'
        });
        return;
      }

      // Withdraw the listing (soft delete)
      const success = await RouteListing.withdrawListing(id);

      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to withdraw listing'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Listing withdrawn successfully'
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to withdraw listing'
      });
    }
  }

  /**
   * PUT /api/marketplace/:id/status
   * Update listing status (publish/withdraw)
   */
  static async updateListingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = [ListingStatus.DRAFT, ListingStatus.ACTIVE, ListingStatus.WITHDRAWN];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be: draft, active, or withdrawn'
        });
        return;
      }

      // Check if listing exists and user has access
      const existingListing = await RouteListing.findById(id);
      if (!existingListing) {
        res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingListing.seller_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Check if status change is allowed
      if (existingListing.status === ListingStatus.SOLD) {
        res.status(409).json({
          success: false,
          error: 'Cannot change status of sold listing'
        });
        return;
      }

      if (existingListing.status === ListingStatus.IN_ESCROW && status !== ListingStatus.WITHDRAWN) {
        res.status(409).json({
          success: false,
          error: 'Listing in escrow can only be withdrawn'
        });
        return;
      }

      const success = await RouteListing.updateListingStatus(id, status);

      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update listing status'
        });
        return;
      }

      res.json({
        success: true,
        message: `Listing ${status === ListingStatus.ACTIVE ? 'published' : status === ListingStatus.WITHDRAWN ? 'withdrawn' : 'updated'} successfully`
      });
    } catch (error) {
      console.error('Error updating listing status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update listing status'
      });
    }
  }

  /**
   * GET /api/marketplace/my-listings
   * Get current user's listings
   */
  static async getMyListings(req: Request, res: Response): Promise<void> {
    try {
      const listings = await RouteListing.findBySellerId(req.user?.id || '');

      res.json({
        success: true,
        data: listings
      });
    } catch (error) {
      console.error('Error fetching user listings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch your listings'
      });
    }
  }
}