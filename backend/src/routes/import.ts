import express, { Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { ImportService } from '../services/import/ImportService';
import { DuplicateStrategy } from '../services/import/types/import.types';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const importService = new ImportService();

/**
 * @route POST /api/import/csv/validate
 * @desc Validate a CSV file without importing
 * @access Private
 */
router.post('/csv/validate', authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<Response | void> => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const result = await importService.previewImport(req.file.buffer);

    res.json({
      success: result.success,
      data: {
        importId: result.importId,
        totalRows: result.processedRecords,
        errors: result.errors,
        warnings: result.warnings,
        stats: result.progress
      }
    });

  } catch (error: any) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate CSV file'
    });
  }
});

/**
 * @route POST /api/import/csv/preview
 * @desc Parse and preview CSV data
 * @access Private
 */
router.post('/csv/preview', authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<Response | void> => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get preview with first 10 rows
    const result = await importService.previewImport(req.file.buffer);

    // Return preview data
    res.json({
      success: result.success,
      data: {
        importId: result.importId,
        totalRows: result.processedRecords,
        previewAccounts: result.accounts?.slice(0, 10) || [],
        errors: result.errors,
        warnings: result.warnings,
        metadata: result.metadata
      }
    });

  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview CSV file'
    });
  }
});

/**
 * @route POST /api/import/csv/execute
 * @desc Import CSV data into database
 * @access Private
 */
router.post('/csv/execute', authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<Response | void> => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Parse import options from request body
    const {
      routeId,
      routeName,
      duplicateStrategy = DuplicateStrategy.SKIP,
      validateOnly = false
    } = req.body;

    const result = await importService.importCSV(req.file.buffer, {
      userId: req.user!.id,
      routeId,
      routeName,
      duplicateStrategy,
      validateOnly
    });

    // Return appropriate status code
    const statusCode = result.success ? 200 : result.status === 'partial_success' ? 207 : 400;

    res.status(statusCode).json({
      success: result.success,
      data: {
        importId: result.importId,
        status: result.status,
        processedRecords: result.processedRecords,
        createdAccounts: result.createdAccounts,
        updatedAccounts: result.updatedAccounts,
        skippedAccounts: result.skippedAccounts,
        routeId: result.route?.id,
        errors: result.errors,
        warnings: result.warnings,
        metadata: result.metadata
      }
    });

  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import CSV file'
    });
  }
});

/**
 * @route GET /api/import/templates
 * @desc Get sample CSV templates
 * @access Public
 */
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = [
      {
        name: 'basic-route.csv',
        description: 'Basic template with 10 sample accounts',
        url: '/api/import/templates/download/basic-route.csv'
      },
      {
        name: 'multi-route.csv',
        description: 'Template for importing multiple routes',
        url: '/api/import/templates/download/multi-route.csv'
      }
    ];

    res.json({
      success: true,
      data: templates
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

/**
 * @route GET /api/import/templates/download/:filename
 * @desc Download a sample CSV template
 * @access Public
 */
router.get('/templates/download/:filename', (req: Request, res: Response): Response | void => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (!filename.endsWith('.csv') || filename.includes('..')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const filePath = path.join(__dirname, '../../..', 'test-data', 'sample-imports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.download(filePath, filename);

  } catch (error: any) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download template'
    });
  }
});

/**
 * @route GET /api/import/history
 * @desc Get import history for current user
 * @access Private
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement import history retrieval from database
    // For now, return empty array
    res.json({
      success: true,
      data: []
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get import history'
    });
  }
});

export default router;