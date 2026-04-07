#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Load the CSV schema
const schemaPath = path.join(__dirname, '..', 'schemas', 'csv-import.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

interface ValidationStats {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicates: number;
  missingEmails: number;
  missingPhones: number;
}

class CSVValidator {
  private validate: any;

  constructor() {
    this.validate = ajv.compile(schema);
  }

  validateCSVFile(filePath: string): ValidationResult {
    console.log(`\n📋 Validating: ${path.basename(filePath)}`);
    console.log('─'.repeat(50));

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const stats: ValidationStats = {
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      duplicates: 0,
      missingEmails: 0,
      missingPhones: 0
    };

    try {
      // Read and parse CSV
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      stats.totalRows = records.length;

      // Track seen addresses for duplicate detection
      const seenAddresses = new Map<string, number>();

      // Validate each record
      records.forEach((record: any, index: number) => {
        const rowNum = index + 2; // Account for header row + 1-based indexing

        // Convert monthly_rate to number if it's a string
        if (record.monthly_rate && typeof record.monthly_rate === 'string') {
          const rate = parseFloat(record.monthly_rate);
          if (!isNaN(rate)) {
            record.monthly_rate = rate;
          }
        }

        // Schema validation
        const valid = this.validate(record);
        if (!valid) {
          stats.errorRows++;
          this.validate.errors.forEach((err: any) => {
            const field = err.instancePath.replace('/', '') || err.params.missingProperty;
            errors.push({
              row: rowNum,
              field,
              value: record[field],
              message: err.message
            });
          });
        } else {
          stats.validRows++;
        }

        // Business logic validation
        this.validateBusinessRules(record, rowNum, errors, warnings);

        // Duplicate detection
        const addressKey = `${record.street}|${record.city}|${record.state}|${record.zip}`.toLowerCase();
        if (seenAddresses.has(addressKey)) {
          warnings.push({
            row: rowNum,
            field: 'address',
            value: record.street,
            message: `Duplicate address (first seen at row ${seenAddresses.get(addressKey)})`
          });
          stats.duplicates++;
        } else {
          seenAddresses.set(addressKey, rowNum);
        }

        // Track missing optional fields
        if (!record.email || record.email.trim() === '') {
          stats.missingEmails++;
        }
        if (!record.phone || record.phone.trim() === '') {
          stats.missingPhones++;
        }
      });

      // Additional file-level checks
      if (stats.totalRows === 0) {
        errors.push({
          row: 0,
          field: 'file',
          value: filePath,
          message: 'CSV file is empty'
        });
      }

      if (stats.totalRows > 1000) {
        warnings.push({
          row: 0,
          field: 'file',
          value: filePath,
          message: `Large file with ${stats.totalRows} rows may take longer to process`
        });
      }

    } catch (error: any) {
      errors.push({
        row: 0,
        field: 'file',
        value: filePath,
        message: `Failed to parse CSV: ${error.message}`
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }

  private validateBusinessRules(
    record: any,
    rowNum: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for reasonable rate ranges
    if (record.monthly_rate) {
      const rate = parseFloat(record.monthly_rate);
      if (rate < 50) {
        warnings.push({
          row: rowNum,
          field: 'monthly_rate',
          value: rate,
          message: 'Unusually low rate (< $50)'
        });
      } else if (rate > 1000) {
        warnings.push({
          row: rowNum,
          field: 'monthly_rate',
          value: rate,
          message: 'Unusually high rate (> $1000)'
        });
      }
    }

    // Validate state is California (business requirement)
    if (record.state && record.state !== 'CA') {
      warnings.push({
        row: rowNum,
        field: 'state',
        value: record.state,
        message: 'Service area is currently limited to California'
      });
    }

    // Check service type matches frequency
    if (record.service_type === 'onetime' && record.frequency !== 'monthly') {
      warnings.push({
        row: rowNum,
        field: 'service_type',
        value: record.service_type,
        message: 'One-time service typically uses monthly frequency'
      });
    }

    // Validate phone number format if provided
    if (record.phone && record.phone.trim() !== '') {
      const phoneRegex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$|^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$|^[0-9]{10}$/;
      if (!phoneRegex.test(record.phone)) {
        errors.push({
          row: rowNum,
          field: 'phone',
          value: record.phone,
          message: 'Invalid phone number format'
        });
      }
    }

    // Check for suspicious data
    if (record.customer_name) {
      if (record.customer_name.toLowerCase().includes('test') ||
          record.customer_name.toLowerCase().includes('sample')) {
        warnings.push({
          row: rowNum,
          field: 'customer_name',
          value: record.customer_name,
          message: 'Name appears to be test data'
        });
      }
    }
  }

  printResults(result: ValidationResult): void {
    const { valid, errors, warnings, stats } = result;

    // Print statistics
    console.log('\n📊 Statistics:');
    console.log(`   Total rows: ${stats.totalRows}`);
    console.log(`   Valid rows: ${stats.validRows}`);
    console.log(`   Error rows: ${stats.errorRows}`);
    console.log(`   Duplicates: ${stats.duplicates}`);
    console.log(`   Missing emails: ${stats.missingEmails} (${Math.round(stats.missingEmails / stats.totalRows * 100)}%)`);
    console.log(`   Missing phones: ${stats.missingPhones} (${Math.round(stats.missingPhones / stats.totalRows * 100)}%)`);

    // Print errors
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.slice(0, 10).forEach(error => {
        console.log(`   Row ${error.row}: ${error.field} - ${error.message}`);
        if (error.value !== undefined) {
          console.log(`      Value: "${error.value}"`);
        }
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.slice(0, 5).forEach(warning => {
        console.log(`   Row ${warning.row}: ${warning.field} - ${warning.message}`);
      });
      if (warnings.length > 5) {
        console.log(`   ... and ${warnings.length - 5} more warnings`);
      }
    }

    // Final result
    console.log('\n' + '─'.repeat(50));
    if (valid) {
      console.log('✅ Validation PASSED - File is ready for import');
    } else {
      console.log('❌ Validation FAILED - Please fix errors before importing');
    }
  }

  validateDirectory(dirPath: string): void {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv'));

    console.log(`\n🔍 Found ${files.length} CSV files to validate\n`);

    const results: { file: string; result: ValidationResult }[] = [];

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const result = this.validateCSVFile(filePath);
      results.push({ file, result });
      this.printResults(result);
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));

    const passed = results.filter(r => r.result.valid).length;
    const failed = results.filter(r => !r.result.valid).length;

    console.log(`✅ Passed: ${passed}/${files.length}`);
    console.log(`❌ Failed: ${failed}/${files.length}`);

    if (failed > 0) {
      console.log('\nFailed files:');
      results.filter(r => !r.result.valid).forEach(r => {
        console.log(`  - ${r.file} (${r.result.errors.length} errors)`);
      });
    }
  }
}

// Main execution
if (require.main === module) {
  const validator = new CSVValidator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: ts-node validate-imports.ts <csv-file-or-directory>');
    console.log('\nExamples:');
    console.log('  ts-node validate-imports.ts ../sample-imports/basic-route.csv');
    console.log('  ts-node validate-imports.ts ../sample-imports/');
    process.exit(1);
  }

  const target = args[0];
  const targetPath = path.resolve(target);

  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
      validator.validateDirectory(targetPath);
    } else if (stats.isFile() && targetPath.endsWith('.csv')) {
      const result = validator.validateCSVFile(targetPath);
      validator.printResults(result);
    } else {
      console.error('❌ Target must be a CSV file or directory');
      process.exit(1);
    }
  } else {
    console.error(`❌ Path not found: ${targetPath}`);
    process.exit(1);
  }
}