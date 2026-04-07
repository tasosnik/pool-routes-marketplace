import express from 'express';
import { MarketplaceController } from '../controllers/MarketplaceController';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Public routes (no authentication required)
// GET /api/marketplace - List marketplace listings with filters (public access)
router.get('/', optionalAuth, MarketplaceController.getListings);

// Protected routes (authentication required)
// GET /api/marketplace/my-listings - Get current user's listings (must be before /:id)
router.get('/my/listings',
  authenticateToken,
  requireRole([UserRole.SELLER, UserRole.OPERATOR, UserRole.ADMIN]),
  MarketplaceController.getMyListings
);

// GET /api/marketplace/:id - Get specific listing details (public access for active listings)
router.get('/:id', optionalAuth, MarketplaceController.getListing);

// POST /api/marketplace - Create new marketplace listing (sellers and operators can list routes)
router.post('/',
  authenticateToken,
  requireRole([UserRole.SELLER, UserRole.OPERATOR, UserRole.ADMIN]),
  MarketplaceController.createListing
);

// PUT /api/marketplace/:id - Update listing (owner or admin only)
router.put('/:id',
  authenticateToken,
  MarketplaceController.updateListing
);

// DELETE /api/marketplace/:id - Delete listing (owner or admin only)
router.delete('/:id',
  authenticateToken,
  MarketplaceController.deleteListing
);

// PUT /api/marketplace/:id/status - Update listing status (owner or admin only)
router.put('/:id/status',
  authenticateToken,
  MarketplaceController.updateListingStatus
);

export default router;