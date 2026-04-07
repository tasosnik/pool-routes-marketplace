import { parse } from 'csv-parse';
import { Readable } from 'stream';
import iconv from 'iconv-lite';
import chardet from 'chardet';
import {
  IParser,
  ParserOptions,
  ParseResult,
  ImportError,
  ImportMetadata,
  NormalizedAccount,
  ValidationResult,
  ImportWarning,
  ValidationStats
} from '../types/import.types';

export class CSVParser implements IParser<NormalizedAccount> {
  private readonly defaultOptions: ParserOptions = {
    encoding: 'utf-8',
    delimiter: ',',
    hasHeaders: true,
    skipRows: 0,
    maxRows: 10000
  };

  private readonly requiredColumns = [
    'customer_name',
    'street',
    'city',
    'state',
    'zip',
    'monthly_rate'
  ];

  private readonly columnMappings: Record<string, string[]> = {
    customer_name: ['customer_name', 'customer', 'name', 'client_name', 'client'],
    street: ['street', 'address', 'street_address', 'address1', 'address_1'],
    city: ['city', 'town'],
    state: ['state', 'st'],
    zip: ['zip', 'zip_code', 'zipcode', 'postal_code'],
    email: ['email', 'email_address', 'e-mail'],
    phone: ['phone', 'phone_number', 'telephone', 'tel'],
    service_type: ['service_type', 'type', 'service'],
    frequency: ['frequency', 'service_frequency', 'schedule'],
    monthly_rate: ['monthly_rate', 'rate', 'price', 'monthly_price', 'amount'],
    pool_type: ['pool_type', 'type_of_pool', 'pool'],
    pool_size: ['pool_size', 'size', 'pool_dimensions'],
    notes: ['notes', 'comments', 'special_instructions', 'instructions']
  };

  async parse(buffer: Buffer, options?: ParserOptions): Promise<ParseResult<NormalizedAccount>> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    const errors: ImportError[] = [];
    const accounts: NormalizedAccount[] = [];

    try {
      // Detect encoding
      const detectedEncoding = chardet.detect(buffer);
      const encoding = detectedEncoding || opts.encoding || 'utf-8';

      // Convert buffer to string with proper encoding
      let csvString: string;
      if (encoding.toLowerCase() !== 'utf-8') {
        csvString = iconv.decode(buffer, encoding);
      } else {
        csvString = buffer.toString('utf-8');
      }

      // Remove BOM if present
      if (csvString.charCodeAt(0) === 0xFEFF) {
        csvString = csvString.slice(1);
      }

      // Parse CSV
      const records = await this.parseCSV(csvString, opts);

      if (records.length === 0) {
        errors.push({
          message: 'CSV file is empty',
          code: 'EMPTY_FILE'
        });
        return this.createParseResult([], errors, buffer, startTime);
      }

      // Detect and map columns
      const columnMap = this.detectColumns(records[0]);
      const missingColumns = this.findMissingColumns(columnMap);

      if (missingColumns.length > 0) {
        errors.push({
          message: `Missing required columns: ${missingColumns.join(', ')}`,
          code: 'MISSING_COLUMNS'
        });
        return this.createParseResult([], errors, buffer, startTime);
      }

      // Process each row
      records.forEach((record, index) => {
        if (opts.skipRows && index < opts.skipRows) return;
        if (opts.maxRows && accounts.length >= opts.maxRows) return;

        const rowNum = index + 2; // Account for header row + 1-based indexing
        const result = this.normalizeRow(record, columnMap, rowNum);

        if (result.errors.length > 0) {
          errors.push(...result.errors);
        } else if (result.account) {
          accounts.push(result.account);
        }
      });

      return this.createParseResult(accounts, errors, buffer, startTime);

    } catch (error: any) {
      errors.push({
        message: `Failed to parse CSV: ${error.message}`,
        code: 'PARSE_ERROR'
      });
      return this.createParseResult([], errors, buffer, startTime);
    }
  }

  validate(accounts: NormalizedAccount[]): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const seenAddresses = new Map<string, number>();
    const stats: ValidationStats = {
      totalRows: accounts.length,
      validRows: 0,
      errorRows: 0,
      duplicates: 0,
      skipped: 0
    };

    accounts.forEach((account, index) => {
      const rowNum = index + 2;
      let hasError = false;

      // Required field validation
      if (!account.customerName?.trim()) {
        errors.push({
          row: rowNum,
          field: 'customer_name',
          message: 'Customer name is required',
          code: 'REQUIRED_FIELD'
        });
        hasError = true;
      }

      if (!account.street?.trim()) {
        errors.push({
          row: rowNum,
          field: 'street',
          message: 'Street address is required',
          code: 'REQUIRED_FIELD'
        });
        hasError = true;
      }

      // Monthly rate validation
      if (account.monthlyRate <= 0) {
        errors.push({
          row: rowNum,
          field: 'monthly_rate',
          value: account.monthlyRate,
          message: 'Monthly rate must be greater than 0',
          code: 'INVALID_VALUE'
        });
        hasError = true;
      } else if (account.monthlyRate > 10000) {
        warnings.push({
          row: rowNum,
          field: 'monthly_rate',
          value: account.monthlyRate,
          message: 'Unusually high monthly rate',
          code: 'SUSPICIOUS_VALUE'
        });
      } else if (account.monthlyRate < 50) {
        warnings.push({
          row: rowNum,
          field: 'monthly_rate',
          value: account.monthlyRate,
          message: 'Unusually low monthly rate',
          code: 'SUSPICIOUS_VALUE'
        });
      }

      // Email validation
      if (account.email && !this.isValidEmail(account.email)) {
        errors.push({
          row: rowNum,
          field: 'email',
          value: account.email,
          message: 'Invalid email format',
          code: 'INVALID_FORMAT'
        });
        hasError = true;
      }

      // Phone validation
      if (account.phone && !this.isValidPhone(account.phone)) {
        warnings.push({
          row: rowNum,
          field: 'phone',
          value: account.phone,
          message: 'Phone number may be incorrectly formatted',
          code: 'FORMAT_WARNING'
        });
      }

      // Duplicate detection
      const addressKey = `${account.street}|${account.city}|${account.state}|${account.zipCode}`.toLowerCase();
      if (seenAddresses.has(addressKey)) {
        warnings.push({
          row: rowNum,
          field: 'address',
          message: `Duplicate address (first seen at row ${seenAddresses.get(addressKey)})`,
          code: 'DUPLICATE_ADDRESS'
        });
        stats.duplicates++;
      } else {
        seenAddresses.set(addressKey, rowNum);
      }

      // Update stats
      if (hasError) {
        stats.errorRows++;
      } else {
        stats.validRows++;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }

  private async parseCSV(csvString: string, options: ParserOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const parser = parse({
        delimiter: options.delimiter,
        columns: options.hasHeaders,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        skip_records_with_error: false
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(records);
      });

      const stream = Readable.from(csvString);
      stream.pipe(parser);
    });
  }

  private detectColumns(headerRow: any): Record<string, string> {
    const columnMap: Record<string, string> = {};
    const headers = Object.keys(headerRow).map(h => h.toLowerCase().trim());

    for (const [field, variations] of Object.entries(this.columnMappings)) {
      for (const variation of variations) {
        if (headers.includes(variation.toLowerCase())) {
          const originalHeader = Object.keys(headerRow).find(
            h => h.toLowerCase().trim() === variation.toLowerCase()
          );
          if (originalHeader) {
            columnMap[field] = originalHeader;
            break;
          }
        }
      }
    }

    return columnMap;
  }

  private findMissingColumns(columnMap: Record<string, string>): string[] {
    return this.requiredColumns.filter(col => !columnMap[col]);
  }

  private normalizeRow(
    record: any,
    columnMap: Record<string, string>,
    rowNum: number
  ): { account?: NormalizedAccount; errors: ImportError[] } {
    const errors: ImportError[] = [];

    try {
      // Parse monthly rate
      const rateValue = record[columnMap['monthly_rate']];
      const monthlyRate = this.parseNumber(rateValue);

      if (isNaN(monthlyRate)) {
        errors.push({
          row: rowNum,
          field: 'monthly_rate',
          value: rateValue,
          message: 'Invalid monthly rate value',
          code: 'INVALID_NUMBER'
        });
        return { errors };
      }

      // Create normalized account
      const account: NormalizedAccount = {
        customerName: record[columnMap['customer_name']]?.trim() || '',
        street: record[columnMap['street']]?.trim() || '',
        city: record[columnMap['city']]?.trim() || '',
        state: (record[columnMap['state']]?.trim() || '').toUpperCase(),
        zipCode: record[columnMap['zip']]?.trim() || '',
        email: record[columnMap['email']]?.trim() || undefined,
        phone: this.normalizePhone(record[columnMap['phone']]),
        serviceType: record[columnMap['service_type']]?.toLowerCase() || 'weekly',
        frequency: record[columnMap['frequency']]?.toLowerCase() || 'weekly',
        monthlyRate,
        poolType: record[columnMap['pool_type']]?.toLowerCase() || 'chlorine',
        poolSize: record[columnMap['pool_size']]?.toLowerCase() || undefined,
        notes: record[columnMap['notes']]?.trim() || undefined
      };

      // Validate state code
      if (account.state && !/^[A-Z]{2}$/.test(account.state)) {
        errors.push({
          row: rowNum,
          field: 'state',
          value: account.state,
          message: 'State must be a 2-letter code',
          code: 'INVALID_STATE'
        });
      }

      // Validate ZIP code
      if (account.zipCode && !/^\d{5}(-\d{4})?$/.test(account.zipCode)) {
        errors.push({
          row: rowNum,
          field: 'zip',
          value: account.zipCode,
          message: 'Invalid ZIP code format',
          code: 'INVALID_ZIP'
        });
      }

      return errors.length > 0 ? { errors } : { account, errors: [] };

    } catch (error: any) {
      errors.push({
        row: rowNum,
        message: `Failed to process row: ${error.message}`,
        code: 'ROW_PROCESSING_ERROR'
      });
      return { errors };
    }
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[$,]/g, '').trim();
      return parseFloat(cleaned);
    }
    return NaN;
  }

  private normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;

    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      // Format as XXX-XXX-XXXX
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone.trim();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\(\)\.]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  private createParseResult(
    accounts: NormalizedAccount[],
    errors: ImportError[],
    buffer: Buffer,
    startTime: number
  ): ParseResult<NormalizedAccount> {
    const metadata: ImportMetadata = {
      fileName: 'uploaded.csv',
      fileSize: buffer.length,
      mimeType: 'text/csv',
      rowCount: accounts.length,
      parsedAt: new Date(),
      processingTime: Date.now() - startTime
    };

    return {
      success: errors.length === 0,
      data: accounts,
      errors,
      metadata
    };
  }
}