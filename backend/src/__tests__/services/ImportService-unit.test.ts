import { ImportService } from '../../services/import/ImportService';
import { ImportOptions, DuplicateStrategy, ImportStatus } from '../../services/import/types/import.types';

// Mock all dependencies
jest.mock('../../services/import/parsers/CSVParser');
jest.mock('../../services/import/validators/DuplicateChecker');
jest.mock('../../models/PoolAccount');
jest.mock('../../models/Route');
jest.mock('../../config/database');
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-import-id')
}));

const createMockCSVParser = () => ({
  parse: jest.fn(),
  validate: jest.fn()
});

const createMockDuplicateChecker = () => ({
  checkBatchDuplicates: jest.fn(),
  handleDuplicateInTransaction: jest.fn()
});

const createMockRoute = () => ({
  createRoute: jest.fn(),
  findById: jest.fn()
});

const createMockPoolAccount = () => ({
  transaction: jest.fn(),
  createAccountInTransaction: jest.fn()
});

describe('ImportService - Unit Tests', () => {
  let importService: ImportService;
  let mockCSVParser: any;
  let mockDuplicateChecker: any;
  let mockRouteModel: any;
  let mockPoolAccountModel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mocks
    mockCSVParser = createMockCSVParser();
    mockDuplicateChecker = createMockDuplicateChecker();
    mockRouteModel = createMockRoute();
    mockPoolAccountModel = createMockPoolAccount();

    // Mock the constructors
    require('../../services/import/parsers/CSVParser').CSVParser.mockImplementation(() => mockCSVParser);
    require('../../services/import/validators/DuplicateChecker').DuplicateChecker.mockImplementation(() => mockDuplicateChecker);

    // Mock the model classes
    const PoolAccountModel = require('../../models/PoolAccount').PoolAccount;
    const RouteModel = require('../../models/Route').Route;

    Object.assign(PoolAccountModel, mockPoolAccountModel);
    Object.assign(RouteModel, mockRouteModel);

    importService = new ImportService();
  });

  describe('importCSV', () => {
    const validOptions: ImportOptions = {
      userId: 'user-123',
      duplicateStrategy: DuplicateStrategy.SKIP,
      validateOnly: false
    };

    const sampleAccounts = [
      {
        customerName: 'John Doe',
        street: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        email: 'john@example.com',
        phone: '555-1234',
        serviceType: 'weekly',
        frequency: 'weekly',
        monthlyRate: 150,
        poolType: 'chlorine',
        notes: 'Test account'
      }
    ];

    const sampleMetadata = {
      fileName: 'test.csv',
      fileSize: 100,
      mimeType: 'text/csv',
      rowCount: 1,
      parsedAt: new Date(),
      processingTime: 100
    };

    it('should successfully parse and validate CSV file', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      mockRouteModel.createRoute.mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      mockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        mockPoolAccountModel.createAccountInTransaction = jest.fn().mockResolvedValue({
          id: 'account-123',
          customerName: 'John Doe'
        });
        const mockTrx = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          update: jest.fn().mockResolvedValue(1)
        });
        (mockTrx as any).raw = jest.fn().mockResolvedValue({ rows: [{ total_accounts: 1, active_accounts: 1, monthly_revenue: 150, average_rate: 150 }] });
        return callback(mockTrx);
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.processedRecords).toBe(1);
      expect(result.createdAccounts).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockCSVParser.parse).toHaveBeenCalledWith(buffer);
      expect(mockCSVParser.validate).toHaveBeenCalledWith(sampleAccounts);
    });

    it('should handle CSV parsing errors', async () => {
      const buffer = Buffer.from('invalid,csv,data');

      mockCSVParser.parse.mockResolvedValue({
        success: false,
        data: [],
        errors: [{ message: 'Invalid CSV format', code: 'PARSE_ERROR' }],
        metadata: sampleMetadata
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(false);
      expect(result.status).toBe(ImportStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('PARSE_ERROR');
    });

    it('should handle validation errors', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: false,
        errors: [{ message: 'Missing required field', code: 'VALIDATION_ERROR', row: 1 }],
        warnings: [],
        stats: { totalRows: 1, validRows: 0, errorRows: 1, duplicates: 0, skipped: 0 }
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(false);
      expect(result.status).toBe(ImportStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VALIDATION_ERROR');
    });

    it('should perform validation only when requested', async () => {
      const buffer = Buffer.from('csv,data,here');
      const validationOnlyOptions = { ...validOptions, validateOnly: true };

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [{ message: 'Minor issue', code: 'WARNING', row: 1 }],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      const result = await importService.importCSV(buffer, validationOnlyOptions);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.processedRecords).toBe(1);
      expect(result.createdAccounts).toBe(0); // No accounts created in validation mode
      expect(result.warnings).toHaveLength(1);
      expect(mockRouteModel.createRoute).not.toHaveBeenCalled();
    });

    it('should use existing route when routeId provided', async () => {
      const buffer = Buffer.from('csv,data,here');
      const optionsWithRouteId = {
        ...validOptions,
        routeId: 'existing-route-123'
      };

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      mockRouteModel.findById.mockResolvedValue({
        id: 'existing-route-123',
        ownerId: 'user-123',
        name: 'Existing Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      mockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        mockPoolAccountModel.createAccountInTransaction = jest.fn().mockResolvedValue({
          id: 'account-123'
        });
        const mockTrx = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          update: jest.fn().mockResolvedValue(1)
        });
        (mockTrx as any).raw = jest.fn().mockResolvedValue({ rows: [{ total_accounts: 1, active_accounts: 1, monthly_revenue: 150, average_rate: 150 }] });
        return callback(mockTrx);
      });

      const result = await importService.importCSV(buffer, optionsWithRouteId);

      expect(result.success).toBe(true);
      expect(mockRouteModel.findById).toHaveBeenCalledWith('existing-route-123');
      expect(mockRouteModel.createRoute).not.toHaveBeenCalled();
    });

    it('should reject access to routes not owned by user', async () => {
      const buffer = Buffer.from('csv,data,here');
      const optionsWithRouteId = {
        ...validOptions,
        routeId: 'other-user-route-123'
      };

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      mockRouteModel.findById.mockResolvedValue({
        id: 'other-user-route-123',
        ownerId: 'other-user-456',
        name: 'Other User Route'
      });

      const result = await importService.importCSV(buffer, optionsWithRouteId);

      expect(result.success).toBe(false);
      expect(result.status).toBe(ImportStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should handle duplicate accounts according to strategy', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      mockRouteModel.createRoute.mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      // Mock duplicate found
      const duplicateResults = new Map();
      duplicateResults.set(0, {
        isDuplicate: true,
        existingId: 'existing-account-123',
        matchType: 'exact',
        confidence: 0.95
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(duplicateResults);

      mockDuplicateChecker.handleDuplicateInTransaction.mockResolvedValue({
        action: 'skipped'
      });

      mockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        const mockTrx = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          update: jest.fn().mockResolvedValue(1)
        });
        (mockTrx as any).raw = jest.fn().mockResolvedValue({ rows: [{ total_accounts: 1, active_accounts: 1, monthly_revenue: 150, average_rate: 150 }] });
        return callback(mockTrx);
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(true);
      expect(result.skippedAccounts).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('DUPLICATE_SKIPPED');
    });

    it('should handle transaction failures gracefully', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: sampleMetadata
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      mockRouteModel.createRoute.mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      mockPoolAccountModel.transaction.mockRejectedValue(new Error('Transaction failed'));

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(false);
      expect(result.status).toBe(ImportStatus.FAILED);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('IMPORT_FAILED');
    });
  });

  describe('previewImport', () => {
    it('should preview import without saving data', async () => {
      const buffer = Buffer.from('csv,data,here');
      const sampleAccounts = [
        {
          customerName: 'Preview Customer',
          street: '456 Preview St',
          city: 'Preview City',
          state: 'CA',
          zipCode: '90211',
          serviceType: 'weekly',
          frequency: 'weekly',
          monthlyRate: 200,
          poolType: 'saltwater'
        }
      ];

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: {
          fileName: 'preview.csv',
          fileSize: 150,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 50
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      const result = await importService.previewImport(buffer);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.processedRecords).toBe(1);
      expect(result.createdAccounts).toBe(0); // No accounts created in preview
      expect(mockRouteModel.createRoute).not.toHaveBeenCalled();
      expect(mockPoolAccountModel.transaction).not.toHaveBeenCalled();
    });

    it('should show validation errors in preview', async () => {
      const buffer = Buffer.from('invalid,csv,data');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: [{ customerName: '' }], // Invalid account data
        errors: [],
        metadata: {
          fileName: 'invalid.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 50
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: false,
        errors: [
          { message: 'Missing customer name', code: 'REQUIRED_FIELD', row: 1 },
          { message: 'Invalid address', code: 'INVALID_ADDRESS', row: 1 }
        ],
        warnings: [],
        stats: { totalRows: 1, validRows: 0, errorRows: 1, duplicates: 0, skipped: 0 }
      });

      const result = await importService.previewImport(buffer);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe('REQUIRED_FIELD');
      expect(result.errors[1].code).toBe('INVALID_ADDRESS');
    });
  });

  describe('business logic validation', () => {
    it('should correctly identify validation-only requests', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: [{ customerName: 'Test' }],
        errors: [],
        metadata: {
          fileName: 'test.csv',
          fileSize: 50,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 25
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      const result = await importService.importCSV(buffer, {
        userId: 'user-123',
        duplicateStrategy: DuplicateStrategy.SKIP,
        validateOnly: true
      });

      expect(result.success).toBe(true);
      expect(result.createdAccounts).toBe(0);
      expect(result.status).toBe(ImportStatus.COMPLETED);

      // Ensure no database operations were attempted
      expect(mockRouteModel.createRoute).not.toHaveBeenCalled();
      expect(mockPoolAccountModel.transaction).not.toHaveBeenCalled();
    });

    it('should create route with custom name when provided', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: [{ customerName: 'Test Customer' }],
        errors: [],
        metadata: {
          fileName: 'test.csv',
          fileSize: 50,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 25
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: { totalRows: 1, validRows: 1, errorRows: 0, duplicates: 0, skipped: 0 }
      });

      mockRouteModel.createRoute.mockResolvedValue({
        id: 'new-route-123',
        name: 'Custom Route Name'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      mockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        mockPoolAccountModel.createAccountInTransaction = jest.fn().mockResolvedValue({
          id: 'account-123'
        });
        const mockTrx = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          update: jest.fn().mockResolvedValue(1)
        });
        (mockTrx as any).raw = jest.fn().mockResolvedValue({ rows: [{ total_accounts: 1, active_accounts: 1, monthly_revenue: 150, average_rate: 150 }] });
        return callback(mockTrx);
      });

      const result = await importService.importCSV(buffer, {
        userId: 'user-123',
        routeName: 'Custom Route Name',
        duplicateStrategy: DuplicateStrategy.SKIP,
        validateOnly: false
      });

      expect(mockRouteModel.createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-123',
          name: 'Custom Route Name'
        })
      );
    });
  });
});