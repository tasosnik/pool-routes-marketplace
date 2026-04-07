import express from 'express';
import { RoutesController } from '../controllers/RoutesController';
import { authenticateToken, requireRole, requireOwnership } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/routes - List user's routes (or all for admin) with pagination
router.get('/', RoutesController.getRoutes);

// POST /api/routes - Create new route (operators and sellers can create routes)
router.post('/',
  requireRole([UserRole.OPERATOR, UserRole.SELLER, UserRole.ADMIN]),
  RoutesController.createRoute
);

// GET /api/routes/:id - Get specific route details
router.get('/:id', RoutesController.getRoute);

// PUT /api/routes/:id - Update route (owner or admin only)
router.put('/:id',
  requireOwnership('id'),
  RoutesController.updateRoute
);

// DELETE /api/routes/:id - Delete route (owner or admin only)
router.delete('/:id',
  requireOwnership('id'),
  RoutesController.deleteRoute
);

// POST /api/routes/:id/accounts - Add a pool account to a route (owner or admin only)
router.post('/:id/accounts',
  requireOwnership('id'),
  RoutesController.createAccount
);

// PUT /api/routes/:id/sale-status - Toggle route for sale status (owner or admin only)
router.put('/:id/sale-status',
  requireOwnership('id'),
  RoutesController.updateSaleStatus
);

// PUT /api/routes/:id/stats - Recalculate route statistics (owner or admin only)
router.put('/:id/stats',
  requireOwnership('id'),
  RoutesController.recalculateStats
);

export default router;