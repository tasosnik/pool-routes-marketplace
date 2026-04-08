import { Request, Response } from 'express';
import Joi from 'joi';
import { Route } from '../models/Route';
import { PoolAccount } from '../models/PoolAccount';
import { UserRole, ServiceType, ServiceFrequency, PoolType } from '../types';
import { ApiResponse, PaginatedResponse } from '../types';

// Validation schemas
const createRouteSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).optional(),
  serviceArea: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    boundaries: Joi.array().items(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
      })
    ).min(3).required(),
    centerPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required(),
    radius: Joi.number().min(0.1).max(100).optional()
  }).required()
});

const updateRouteSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  serviceArea: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    boundaries: Joi.array().items(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
      })
    ).min(3).required(),
    centerPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required(),
    radius: Joi.number().min(0.1).max(100).optional()
  }).optional()
});

export class RoutesController {
  /**
   * GET /api/routes
   * Get all routes for the authenticated user (or all for admin)
   */
  static async getRoutes(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const offset = (page - 1) * limit;

      let routes;
      let total = 0;

      if (req.user?.role === UserRole.ADMIN) {
        // Admin can see all routes
        const countResult = await Route.raw('SELECT COUNT(*) as count FROM routes');
        total = parseInt(countResult.rows[0].count);

        const routesResult = await Route.raw(`
          SELECT r.*, u.first_name, u.last_name, u.email as owner_email
          FROM routes r
          LEFT JOIN users u ON r.owner_id = u.id
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Map routes manually since mapToRoute is private
        routes = routesResult.rows.map((route: any) => ({
          id: route.id,
          ownerId: route.owner_id,
          name: route.name,
          description: route.description,
          serviceArea: {
            name: route.service_area_name,
            boundaries: route.service_area_boundaries ? JSON.parse(route.service_area_boundaries) : [],
            centerPoint: route.service_area_center ? JSON.parse(route.service_area_center) : { latitude: 0, longitude: 0 },
            radius: route.service_area_radius
          },
          accounts: [],
          totalAccounts: route.total_accounts || 0,
          activeAccounts: route.active_accounts || 0,
          monthlyRevenue: parseFloat(route.monthly_revenue) || 0,
          averageRate: parseFloat(route.average_rate) || 0,
          isForSale: route.is_for_sale,
          askingPrice: route.asking_price ? parseFloat(route.asking_price) : undefined,
          status: route.status,
          createdAt: route.created_at,
          updatedAt: route.updated_at,
          ownerName: `${route.first_name} ${route.last_name}`,
          ownerEmail: route.owner_email
        }));
      } else {
        // Regular users see only their routes
        const countResult = await Route.raw('SELECT COUNT(*) as count FROM routes WHERE owner_id = ?', [req.user?.id]);
        total = parseInt(countResult.rows[0].count);

        routes = await Route.findByOwnerId(req.user?.id || '');
        routes = routes.slice(offset, offset + limit);
      }

      const response: PaginatedResponse = {
        data: routes,
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
      console.error('Error fetching routes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch routes'
      });
    }
  }

  /**
   * GET /api/routes/:id
   * Get a specific route with detailed information
   */
  static async getRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get route with account details
      const route = await Route.getRouteWithAccounts(id);

      if (!route) {
        res.status(404).json({
          success: false,
          error: 'Route not found'
        });
        return;
      }

      // Check if user can access this route
      // Allow access if: admin, owner, or route is listed for sale
      if (req.user?.role !== UserRole.ADMIN && route.ownerId !== req.user?.id && !route.isForSale) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      res.json({
        success: true,
        data: route
      });
    } catch (error) {
      console.error('Error fetching route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch route'
      });
    }
  }

  /**
   * POST /api/routes
   * Create a new route
   */
  static async createRoute(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createRouteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details[0].message
        });
        return;
      }

      const { name, description, serviceArea } = value;

      // Create route
      const route = await Route.createRoute({
        ownerId: req.user?.id || '',
        name,
        description,
        serviceArea
      });

      res.status(201).json({
        success: true,
        data: route,
        message: 'Route created successfully'
      });
    } catch (error) {
      console.error('Error creating route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create route'
      });
    }
  }

  /**
   * PUT /api/routes/:id
   * Update an existing route
   */
  static async updateRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate request body
      const { error, value } = updateRouteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details[0].message
        });
        return;
      }

      // Check if route exists and user has access
      const existingRoute = await Route.findById(id);
      if (!existingRoute) {
        res.status(404).json({
          success: false,
          error: 'Route not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingRoute.owner_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Prepare update data
      const updateData: any = {};

      if (value.name) updateData.name = value.name;
      if (value.description !== undefined) updateData.description = value.description;

      if (value.serviceArea) {
        updateData.service_area_name = value.serviceArea.name;
        updateData.service_area_boundaries = JSON.stringify(value.serviceArea.boundaries);
        updateData.service_area_center = JSON.stringify(value.serviceArea.centerPoint);
        updateData.service_area_center_lat = value.serviceArea.centerPoint.latitude;
        updateData.service_area_center_lng = value.serviceArea.centerPoint.longitude;
        if (value.serviceArea.radius) {
          updateData.service_area_radius = value.serviceArea.radius;
        }
      }

      // Update route
      const updatedRoute = await Route.updateById(id, updateData);

      if (!updatedRoute) {
        res.status(500).json({
          success: false,
          error: 'Failed to update route'
        });
        return;
      }

      // Recalculate route stats
      await Route.updateRouteStats(id);

      // Fetch updated route
      const route = await Route.getRouteWithAccounts(id);

      res.json({
        success: true,
        data: route,
        message: 'Route updated successfully'
      });
    } catch (error) {
      console.error('Error updating route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update route'
      });
    }
  }

  /**
   * DELETE /api/routes/:id
   * Delete a route
   */
  static async deleteRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if route exists and user has access
      const existingRoute = await Route.findById(id);
      if (!existingRoute) {
        res.status(404).json({
          success: false,
          error: 'Route not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingRoute.owner_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Check if route has active accounts (optional protection)
      const accountCount = await Route.raw(`
        SELECT COUNT(*) as count FROM pool_accounts
        WHERE route_id = ? AND status = 'active'
      `, [id]);

      if (parseInt(accountCount.rows[0].count) > 0) {
        res.status(409).json({
          success: false,
          error: 'Cannot delete route with active pool accounts. Please transfer or deactivate accounts first.'
        });
        return;
      }

      // Delete route (cascade will handle related records)
      await Route.deleteById(id);

      res.json({
        success: true,
        message: 'Route deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete route'
      });
    }
  }

  /**
   * PUT /api/routes/:id/sale-status
   * Toggle route for sale status
   */
  static async updateSaleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isForSale, askingPrice } = req.body;

      // Validate input
      if (isForSale && (!askingPrice || askingPrice <= 0)) {
        res.status(400).json({
          success: false,
          error: 'Asking price is required when listing for sale'
        });
        return;
      }

      // Check if route exists and user has access
      const existingRoute = await Route.findById(id);
      if (!existingRoute) {
        res.status(404).json({
          success: false,
          error: 'Route not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingRoute.owner_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      let success = false;
      if (isForSale) {
        success = await Route.setForSale(id, askingPrice);
      } else {
        success = await Route.removeFromSale(id);
      }

      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to update sale status'
        });
        return;
      }

      res.json({
        success: true,
        message: isForSale ? 'Route listed for sale' : 'Route removed from sale'
      });
    } catch (error) {
      console.error('Error updating sale status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update sale status'
      });
    }
  }

  /**
   * PUT /api/routes/:id/stats
   * Manually trigger route statistics recalculation
   */
  static async recalculateStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if route exists and user has access
      const existingRoute = await Route.findById(id);
      if (!existingRoute) {
        res.status(404).json({
          success: false,
          error: 'Route not found'
        });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && existingRoute.owner_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      await Route.updateRouteStats(id);

      res.json({
        success: true,
        message: 'Route statistics updated successfully'
      });
    } catch (error) {
      console.error('Error recalculating route stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update route statistics'
      });
    }
  }

  /**
   * POST /api/routes/:id/accounts
   * Add a pool account to a route
   */
  static async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verify route exists and user owns it
      const route = await Route.findById(id);
      if (!route) {
        res.status(404).json({ success: false, error: 'Route not found' });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && route.owner_id !== req.user?.id) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        street,
        city,
        state,
        zipCode,
        serviceType,
        frequency,
        monthlyRate,
        notes
      } = req.body;

      if (!customerName || !street) {
        res.status(400).json({ success: false, error: 'customerName and street are required' });
        return;
      }

      // Geocode the address to get coordinates for map display
      let coordinates: { latitude: number; longitude: number } | undefined;
      try {
        const addressParts = [street, city, state, zipCode].filter(Boolean).join(', ');
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressParts)}&limit=1`;
        const geocodeRes = await fetch(geocodeUrl, {
          headers: { 'User-Agent': 'PoolRouteOS/1.0' }
        });
        const geocodeData = await geocodeRes.json() as Array<{ lat: string; lon: string }>;
        if (geocodeData.length > 0) {
          coordinates = {
            latitude: parseFloat(geocodeData[0].lat),
            longitude: parseFloat(geocodeData[0].lon)
          };
        }
      } catch {
        // Geocoding is best-effort — account still gets created without coordinates
      }

      const account = await PoolAccount.createAccount({
        routeId: id,
        customerName,
        customerEmail,
        customerPhone,
        address: { street, city: city || '', state: state || '', zipCode: zipCode || '', coordinates },
        serviceType: serviceType || ServiceType.WEEKLY,
        frequency: frequency || ServiceFrequency.WEEKLY,
        monthlyRate: parseFloat(monthlyRate) || 0,
        equipmentNotes: notes,
        startDate: new Date()
      });

      // Recalculate route stats after adding account
      await Route.updateRouteStats(id);

      res.status(201).json({ success: true, data: account, message: 'Account added successfully' });
    } catch (error) {
      console.error('Error creating pool account:', error);
      res.status(500).json({ success: false, error: 'Failed to create pool account' });
    }
  }

  /**
   * DELETE /api/routes/:id/accounts/:accountId
   * Remove a pool account from a route
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id, accountId } = req.params;

      // Verify route exists and user owns it
      const route = await Route.findById(id);
      if (!route) {
        res.status(404).json({ success: false, error: 'Route not found' });
        return;
      }

      if (req.user?.role !== UserRole.ADMIN && route.owner_id !== req.user?.id) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      // Verify account belongs to this route
      const accounts = await PoolAccount.findByRouteId(id);
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        res.status(404).json({ success: false, error: 'Account not found on this route' });
        return;
      }

      const deleted = await PoolAccount.deleteById(accountId);
      if (!deleted) {
        res.status(500).json({ success: false, error: 'Failed to delete account' });
        return;
      }

      // Recalculate route stats after removing account
      await Route.updateRouteStats(id);

      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting pool account:', error);
      res.status(500).json({ success: false, error: 'Failed to delete pool account' });
    }
  }
}