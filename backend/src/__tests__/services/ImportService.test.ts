import { ImportService } from '../../services/import/ImportService';
import { ImportOptions, DuplicateStrategy, ImportStatus } from '../../services/import/types/import.types';
import { CSVParser } from '../../services/import/parsers/CSVParser';
import { DuplicateChecker } from '../../services/import/validators/DuplicateChecker';
import { PoolAccount as PoolAccountModel } from '../../models/PoolAccount';
import { Route as RouteModel } from '../../models/Route';

// Mock all dependencies
jest.mock('../../services/import/parsers/CSVParser');
jest.mock('../../services/import/validators/DuplicateChecker');
jest.mock('../../models/PoolAccount');
jest.mock('../../models/Route');
jest.mock('../../config/database');
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-import-id')
}));

const MockCSVParser = CSVParser as jest.MockedClass<typeof CSVParser>;
const MockDuplicateChecker = DuplicateChecker as jest.MockedClass<typeof DuplicateChecker>;
const MockPoolAccountModel = PoolAccountModel as jest.Mocked<typeof PoolAccountModel>;
const MockRouteModel = RouteModel as jest.Mocked<typeof RouteModel>;

describe('ImportService', () => {
  let importService: ImportService;
  let mockCSVParser: jest.Mocked<CSVParser>;
  let mockDuplicateChecker: jest.Mocked<DuplicateChecker>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock instances
    mockCSVParser = {
      parse: jest.fn(),
      validate: jest.fn()
    } as any;

    mockDuplicateChecker = {
      checkBatchDuplicates: jest.fn(),
      handleDuplicateInTransaction: jest.fn()
    } as any;

    // Mock constructors to return our mock instances
    MockCSVParser.mockImplementation(() => mockCSVParser);
    MockDuplicateChecker.mockImplementation(() => mockDuplicateChecker);

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

    it('should successfully parse and validate CSV file', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      (MockRouteModel.createRoute as any).mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      (MockPoolAccountModel.transaction as any).mockImplementation(async (callback: any) => {
        return callback({});
      });

      (MockPoolAccountModel.createAccountInTransaction as any) = jest.fn().mockResolvedValue({
        id: 'account-123',
        customerName: 'John Doe'
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
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 0,
          parsedAt: new Date(),
          processingTime: 100
        }
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
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: false,
        errors: [{ message: 'Missing required field', code: 'VALIDATION_ERROR', row: 1 }],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 0,
          errorRows: 1,
          duplicates: 0,
          skipped: 0
        }
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
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [{ message: 'Minor issue', code: 'WARNING', row: 1 }],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      const result = await importService.importCSV(buffer, validationOnlyOptions);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.processedRecords).toBe(1);
      expect(result.createdAccounts).toBe(0); // No accounts created in validation mode
      expect(result.warnings).toHaveLength(1);
      expect(MockRouteModel.createRoute).not.toHaveBeenCalled();
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
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.findById.mockResolvedValue({
        id: 'existing-route-123',
        ownerId: 'user-123',
        name: 'Existing Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      MockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      MockPoolAccountModel.createAccountInTransaction = jest.fn().mockResolvedValue({
        id: 'account-123'
      });

      const result = await importService.importCSV(buffer, optionsWithRouteId);

      expect(result.success).toBe(true);
      expect(MockRouteModel.findById).toHaveBeenCalledWith('existing-route-123');
      expect(MockRouteModel.createRoute).not.toHaveBeenCalled();
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
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.findById.mockResolvedValue({
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
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.createRoute.mockResolvedValue({
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
        action: 'skipped',
        existingAccount: { id: 'existing-account-123' }
      });

      MockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(true);
      expect(result.skippedAccounts).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('DUPLICATE_SKIPPED');
    });

    it('should create new route with default values when no routeId provided', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.createRoute.mockResolvedValue({
        id: 'new-route-123',
        name: 'Imported Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      MockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      MockPoolAccountModel.createAccountInTransaction = jest.fn().mockResolvedValue({
        id: 'account-123'
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(MockRouteModel.createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-123',
          name: 'Imported Route',
          serviceArea: expect.objectContaining({
            name: 'Imported Area',
            centerPoint: { latitude: 34.0522, longitude: -118.2437 }
          })
        })
      );
    });

    it('should abort import when too many errors occur', async () => {
      const buffer = Buffer.from('csv,data,here');
      const manyAccounts = Array.from({ length: 60 }, (_, i) => ({
        ...sampleAccounts[0],
        customerName: `Customer ${i}`
      }));

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: manyAccounts,
        errors: [],
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 60,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 60,
          validRows: 60,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.createRoute.mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      // Mock transaction that throws errors for all accounts
      MockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        const mockTrx = {};

        // Mock createAccountInTransaction to always throw
        MockPoolAccountModel.createAccountInTransaction = jest.fn()
          .mockRejectedValue(new Error('Database error'));

        return callback(mockTrx);
      });

      const result = await importService.importCSV(buffer, validOptions);

      expect(result.success).toBe(false);
      expect(result.status).toBe(ImportStatus.FAILED);
      expect(result.errors.length).toBeGreaterThan(50);
    });

    it('should handle transaction failures gracefully', async () => {
      const buffer = Buffer.from('csv,data,here');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: sampleAccounts,
        errors: [],
        metadata: {
          fileName: 'test.csv',
          fileSize: 100,
          mimeType: 'text/csv',
          rowCount: 1,
          parsedAt: new Date(),
          processingTime: 100
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.createRoute.mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      MockPoolAccountModel.transaction.mockRejectedValue(new Error('Transaction failed'));

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
        stats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      const result = await importService.previewImport(buffer);

      expect(result.success).toBe(true);
      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.processedRecords).toBe(1);
      expect(result.createdAccounts).toBe(0); // No accounts created in preview
      expect(MockRouteModel.createRoute).not.toHaveBeenCalled();
      expect(MockPoolAccountModel.transaction).not.toHaveBeenCalled();
    });

    it('should show validation errors in preview', async () => {
      const buffer = Buffer.from('invalid,csv,data');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: [{}], // Invalid account data
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
        stats: {
          totalRows: 1,
          validRows: 0,
          errorRows: 1,
          duplicates: 0,
          skipped: 0
        }
      });

      const result = await importService.previewImport(buffer);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe('REQUIRED_FIELD');
      expect(result.errors[1].code).toBe('INVALID_ADDRESS');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty CSV files', async () => {
      const buffer = Buffer.from('');

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: [],
        errors: [],
        metadata: {
          fileName: 'empty.csv',
          fileSize: 0,
          mimeType: 'text/csv',
          rowCount: 0,
          parsedAt: new Date(),
          processingTime: 10
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 0,
          validRows: 0,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      const result = await importService.importCSV(buffer, {
        userId: 'user-123',
        duplicateStrategy: DuplicateStrategy.SKIP,
        validateOnly: false
      });

      expect(result.success).toBe(true);
      expect(result.processedRecords).toBe(0);
      expect(result.createdAccounts).toBe(0);
    });

    it('should handle partial success scenarios', async () => {
      const buffer = Buffer.from('csv,data,here');
      const mixedAccounts = [
        { ...sampleAccounts[0], customerName: 'Valid Customer 1' },
        { ...sampleAccounts[0], customerName: 'Valid Customer 2' },
        { ...sampleAccounts[0], customerName: 'Valid Customer 3' }
      ];

      mockCSVParser.parse.mockResolvedValue({
        success: true,
        data: mixedAccounts,
        errors: [],
        metadata: {
          fileName: 'mixed.csv',
          fileSize: 300,
          mimeType: 'text/csv',
          rowCount: 3,
          parsedAt: new Date(),
          processingTime: 150
        }
      });

      mockCSVParser.validate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalRows: 3,
          validRows: 3,
          errorRows: 0,
          duplicates: 0,
          skipped: 0
        }
      });

      MockRouteModel.createRoute.mockResolvedValue({
        id: 'route-123',
        name: 'Test Route'
      });

      mockDuplicateChecker.checkBatchDuplicates.mockResolvedValue(new Map());

      let accountCount = 0;
      MockPoolAccountModel.transaction.mockImplementation(async (callback: any) => {
        MockPoolAccountModel.createAccountInTransaction = jest.fn()
          .mockImplementation(async () => {
            accountCount++;
            if (accountCount === 2) {
              throw new Error('Failed to create account 2');
            }
            return { id: `account-${accountCount}` };
          });

        return callback({});
      });

      const result = await importService.importCSV(buffer, {
        userId: 'user-123',
        duplicateStrategy: DuplicateStrategy.SKIP,
        validateOnly: false
      });

      expect(result.status).toBe(ImportStatus.PARTIAL_SUCCESS);
      expect(result.createdAccounts).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.processedRecords).toBe(3);
    });
  });
});