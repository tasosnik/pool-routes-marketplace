import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CSVParser } from '../services/import/parsers/CSVParser';
import { DuplicateChecker } from '../services/import/validators/DuplicateChecker';
import { ImportService } from '../services/import/ImportService';
import { DuplicateStrategy, ImportStatus } from '../services/import/types/import.types';

describe('Import Service', () => {
  describe('CSVParser', () => {
    let parser: CSVParser;

    beforeEach(() => {
      parser = new CSVParser();
    });

    it('should parse valid CSV data', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"John Doe","123 Main St","Los Angeles","CA","90001","john@email.com","213-555-0001","weekly","weekly","200","chlorine","medium","Test note"
"Jane Smith","456 Oak Ave","Los Angeles","CA","90002","jane@email.com","213-555-0002","biweekly","biweekly","150","saltwater","large",""`;

      const buffer = Buffer.from(csvContent);
      const result = await parser.parse(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].customerName).toBe('John Doe');
      expect(result.data[0].monthlyRate).toBe(200);
      expect(result.data[1].customerName).toBe('Jane Smith');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing required fields', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"","123 Main St","Los Angeles","CA","90001","john@email.com","213-555-0001","weekly","weekly","200","chlorine","medium",""`;

      const buffer = Buffer.from(csvContent);
      const result = await parser.parse(buffer);
      const validation = parser.validate(result.data);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].message).toContain('Customer name is required');
    });

    it('should handle invalid monthly rate', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"John Doe","123 Main St","Los Angeles","CA","90001","john@email.com","213-555-0001","weekly","weekly","invalid","chlorine","medium",""`;

      const buffer = Buffer.from(csvContent);
      const result = await parser.parse(buffer);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Invalid monthly rate');
    });

    it('should detect duplicate addresses within batch', () => {
      const accounts = [
        {
          customerName: 'John Doe',
          street: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          monthlyRate: 200,
          serviceType: 'weekly',
          frequency: 'weekly',
          poolType: 'chlorine'
        },
        {
          customerName: 'Jane Doe',
          street: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          monthlyRate: 200,
          serviceType: 'weekly',
          frequency: 'weekly',
          poolType: 'chlorine'
        }
      ];

      const validation = parser.validate(accounts);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0].message).toContain('Duplicate address');
      expect(validation.stats.duplicates).toBe(1);
    });

    it('should normalize phone numbers', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"John Doe","123 Main St","Los Angeles","CA","90001","","(213) 555-0001","weekly","weekly","200","chlorine","medium",""
"Jane Smith","456 Oak Ave","Los Angeles","CA","90002","","2135550002","weekly","weekly","200","chlorine","medium",""`;

      const buffer = Buffer.from(csvContent);
      const result = await parser.parse(buffer);

      expect(result.success).toBe(true);
      expect(result.data[0].phone).toBe('213-555-0001');
      expect(result.data[1].phone).toBe('213-555-0002');
    });

    it('should handle different CSV encodings', async () => {
      // Test with UTF-8 BOM
      const csvWithBOM = '\uFEFF' + `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"Café Owner","123 Main St","Los Angeles","CA","90001","","","weekly","weekly","200","chlorine","medium",""`;

      const buffer = Buffer.from(csvWithBOM, 'utf-8');
      const result = await parser.parse(buffer);

      expect(result.success).toBe(true);
      expect(result.data[0].customerName).toBe('Café Owner');
    });

    it('should handle large CSV files within limits', async () => {
      // Generate a CSV with 100 rows
      const header = 'customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes\n';
      const rows = [];
      for (let i = 1; i <= 100; i++) {
        rows.push(`"Customer ${i}","${i} Main St","Los Angeles","CA","90001","customer${i}@email.com","213-555-${String(i).padStart(4, '0')}","weekly","weekly","200","chlorine","medium",""`);
      }
      const csvContent = header + rows.join('\n');

      const buffer = Buffer.from(csvContent);
      const result = await parser.parse(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(100);
      expect(result.data[99].customerName).toBe('Customer 100');
    });
  });

  describe('DuplicateChecker', () => {
    let checker: DuplicateChecker;

    beforeEach(() => {
      checker = new DuplicateChecker();
    });

    it('should calculate string similarity correctly', () => {
      // Access private method through type assertion
      const checkerAny = checker as any;

      const similarity1 = checkerAny.calculateSimilarity('john doe', 'john doe');
      expect(similarity1).toBe(1);

      const similarity2 = checkerAny.calculateSimilarity('john doe', 'jon doe');
      expect(similarity2).toBeGreaterThan(0.8);

      const similarity3 = checkerAny.calculateSimilarity('john doe', 'jane smith');
      expect(similarity3).toBeLessThan(0.5);
    });

    it('should normalize addresses for comparison', () => {
      const checkerAny = checker as any;

      expect(checkerAny.normalizeAddress('123 Main St.')).toBe('123 main street');
      expect(checkerAny.normalizeAddress('456 Oak Ave')).toBe('456 oak avenue');
      expect(checkerAny.normalizeAddress('789 Elm Dr, Apt 5')).toBe('789 elm drive apartment 5');
    });

    it('should find internal duplicates in batch', () => {
      const accounts = [
        {
          customerName: 'John Doe',
          street: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          monthlyRate: 200,
          serviceType: 'weekly',
          frequency: 'weekly',
          poolType: 'chlorine'
        },
        {
          customerName: 'Jane Doe',
          street: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          monthlyRate: 200,
          serviceType: 'weekly',
          frequency: 'weekly',
          poolType: 'chlorine'
        }
      ];

      const checkerAny = checker as any;
      const duplicates = checkerAny.findInternalDuplicates(accounts);

      expect(duplicates.size).toBe(1);
      const key = Array.from(duplicates.keys())[0];
      expect(duplicates.get(key)).toEqual([0, 1]);
    });
  });

  describe('ImportService Integration', () => {
    let importService: ImportService;

    beforeEach(() => {
      importService = new ImportService();
    });

    it('should validate CSV without importing', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"Test Customer","123 Test St","Los Angeles","CA","90001","test@email.com","213-555-0001","weekly","weekly","200","chlorine","medium","Test import"`;

      const buffer = Buffer.from(csvContent);
      const result = await importService.previewImport(buffer);

      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.processedRecords).toBe(1);
      expect(result.createdAccounts).toBe(0); // Preview doesn't create accounts
      expect(result.errors).toHaveLength(0);
    });

    it('should handle validation failures gracefully', async () => {
      const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
"","","","","","","","","","-100","","",""`;

      const buffer = Buffer.from(csvContent);
      const result = await importService.previewImport(buffer);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Test Data Files', () => {
    it('should have valid test data for each user', () => {
      const testDataPath = path.join(__dirname, '../../../test-data');

      // Check John Smith's data
      const johnPath = path.join(testDataPath, 'users/john-smith/routes.csv');
      expect(fs.existsSync(johnPath)).toBe(true);
      const johnData = fs.readFileSync(johnPath, 'utf-8');
      expect(johnData).toContain('customer_name');
      expect(johnData.split('\n').length).toBeGreaterThan(10);

      // Check Sarah Johnson's data
      const sarahPath = path.join(testDataPath, 'users/sarah-johnson/routes.csv');
      expect(fs.existsSync(sarahPath)).toBe(true);

      // Check Mike Wilson's data
      const mikePath = path.join(testDataPath, 'users/mike-wilson/routes.csv');
      expect(fs.existsSync(mikePath)).toBe(true);
    });

    it('should have sample import files', () => {
      const samplesPath = path.join(__dirname, '../../../test-data/sample-imports');

      expect(fs.existsSync(path.join(samplesPath, 'basic-route.csv'))).toBe(true);
      expect(fs.existsSync(path.join(samplesPath, 'invalid-samples/missing-fields.csv'))).toBe(true);
      expect(fs.existsSync(path.join(samplesPath, 'invalid-samples/duplicate-accounts.csv'))).toBe(true);
    });

    it('should parse all test user CSV files successfully', async () => {
      const parser = new CSVParser();
      const testDataPath = path.join(__dirname, '../../../test-data/users');

      const userFiles = [
        'john-smith/routes.csv',
        'sarah-johnson/routes.csv',
        'mike-wilson/routes.csv'
      ];

      for (const userFile of userFiles) {
        const filePath = path.join(testDataPath, userFile);
        const csvContent = fs.readFileSync(filePath);
        const result = await parser.parse(csvContent);

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.errors).toHaveLength(0);

        // Validate the parsed data
        const validation = parser.validate(result.data);
        expect(validation.valid).toBe(true);
      }
    });
  });
});