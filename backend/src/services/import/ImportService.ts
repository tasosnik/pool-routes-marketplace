import { v4 as uuidv4 } from 'uuid';
import { PoolAccount as PoolAccountModel } from '../../models/PoolAccount';
import { Route as RouteModel } from '../../models/Route';
import { CSVParser } from './parsers/CSVParser';
import { DuplicateChecker } from './validators/DuplicateChecker';
import {
  ImportOptions,
  ImportResult,
  ImportStatus,
  ImportProgress,
  ImportError,
  ImportWarning,
  NormalizedAccount,
  DuplicateStrategy,
  ImportMetadata
} from './types/import.types';
import { db } from '../../config/database';

export class ImportService {
  private csvParser: CSVParser;
  private duplicateChecker: DuplicateChecker;

  constructor() {
    this.csvParser = new CSVParser();
    this.duplicateChecker = new DuplicateChecker();
  }

  /**
   * Import accounts from a CSV file
   */
  async importCSV(
    buffer: Buffer,
    options: ImportOptions
  ): Promise<ImportResult> {
    const importId = uuidv4();
    const startTime = Date.now();
    const progress: ImportProgress = {
      status: ImportStatus.PENDING,
      currentRow: 0,
      totalRows: 0,
      processedAccounts: 0,
      errors: 0,
      warnings: 0,
      startedAt: new Date()
    };

    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    let createdAccounts = 0;
    let updatedAccounts = 0;
    let skippedAccounts = 0;

    try {
      // Step 1: Parse CSV file
      progress.status = ImportStatus.VALIDATING;
      const parseResult = await this.csvParser.parse(buffer);

      if (!parseResult.success) {
        return this.createFailedResult(
          importId,
          parseResult.errors,
          parseResult.metadata,
          progress
        );
      }

      const accounts = parseResult.data;
      progress.totalRows = accounts.length;

      // Step 2: Validate data
      const validationResult = this.csvParser.validate(accounts);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      if (!validationResult.valid && !options.validateOnly) {
        return this.createFailedResult(
          importId,
          errors,
          parseResult.metadata,
          progress
        );
      }

      // If validation only, return early
      if (options.validateOnly) {
        progress.status = ImportStatus.COMPLETED;
        progress.completedAt = new Date();

        return {
          success: validationResult.valid,
          status: ImportStatus.COMPLETED,
          importId,
          processedRecords: accounts.length,
          createdAccounts: 0,
          updatedAccounts: 0,
          skippedAccounts: 0,
          errors,
          warnings,
          metadata: parseResult.metadata,
          progress
        };
      }

      // Step 3: Get or create route
      progress.status = ImportStatus.PROCESSING;
      let route: any = null;

      if (options.routeId) {
        // Find existing route - the Route model returns the mapped interface
        const foundRoute = await RouteModel.findById(options.routeId);
        if (!foundRoute) {
          errors.push({
            message: 'Route not found',
            code: 'ROUTE_NOT_FOUND'
          });
          return this.createFailedResult(importId, errors, parseResult.metadata, progress);
        }
        route = foundRoute;

        // Verify ownership - try different property names for compatibility
        const ownerId = (route as any).ownerId || (route as any).owner_id;
        if (ownerId !== options.userId) {
          errors.push({
            message: 'Unauthorized: You do not own this route',
            code: 'UNAUTHORIZED'
          });
          return this.createFailedResult(importId, errors, parseResult.metadata, progress);
        }
      } else {
        // Create new route
        route = await RouteModel.createRoute({
          ownerId: options.userId,
          name: options.routeName || 'Imported Route',
          description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
          serviceArea: {
            name: 'Imported Area',
            boundaries: [],
            centerPoint: { latitude: 34.0522, longitude: -118.2437 }, // Default to LA
            radius: 5
          }
        });
      }

      // Get route ID - try different property names
      const routeId = (route as any).id || (route as any).route_id || '';

      // Step 4: Check for duplicates
      const duplicateResults = await this.duplicateChecker.checkBatchDuplicates(
        accounts,
        routeId
      );

      // Step 5: Process accounts with enhanced transaction support
      progress.status = ImportStatus.SAVING;
      const importedAccounts: any[] = [];

      // Process in batches to avoid long-running transactions
      const BATCH_SIZE = 100;
      const batches = this.createBatches(accounts, BATCH_SIZE);

      // Track counters across all batches
      const counters = {
        createdAccounts: 0,
        updatedAccounts: 0,
        skippedAccounts: 0
      };

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStartIndex = batchIndex * BATCH_SIZE;

        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} accounts)`);

        // Use transaction with retry mechanism for each batch
        await this.processAccountBatchWithRetry(
          batch,
          batchStartIndex,
          routeId,
          options,
          duplicateResults,
          progress,
          errors,
          warnings,
          importedAccounts,
          counters
        );
      }

      // Update final counts from counters
      createdAccounts = counters.createdAccounts;
      updatedAccounts = counters.updatedAccounts;
      skippedAccounts = counters.skippedAccounts;

      // Update route statistics in a separate transaction
      if (routeId) {
        await this.updateRouteStatsWithRetry(routeId);
      }

      // Step 6: Complete import
      progress.status = ImportStatus.COMPLETED;
      progress.completedAt = new Date();

      const success = errors.length === 0 ||
                     (createdAccounts + updatedAccounts > 0 && errors.length < accounts.length * 0.1);

      return {
        success,
        status: success ? ImportStatus.COMPLETED : ImportStatus.PARTIAL_SUCCESS,
        importId,
        processedRecords: accounts.length,
        createdAccounts,
        updatedAccounts,
        skippedAccounts,
        errors,
        warnings,
        route,
        accounts: importedAccounts,
        metadata: parseResult.metadata,
        progress
      };

    } catch (error: any) {
      console.error('Import error:', error);
      errors.push({
        message: `Import failed: ${error.message}`,
        code: 'IMPORT_FAILED'
      });

      progress.status = ImportStatus.FAILED;
      progress.completedAt = new Date();

      return this.createFailedResult(importId, errors, {} as ImportMetadata, progress);
    }
  }

  /**
   * Preview import without saving to database
   */
  async previewImport(buffer: Buffer): Promise<ImportResult> {
    const options: ImportOptions = {
      userId: '',
      duplicateStrategy: DuplicateStrategy.SKIP,
      validateOnly: true
    };

    return this.importCSV(buffer, options);
  }

  private async createPoolAccount(
    account: NormalizedAccount,
    routeId: string
  ): Promise<any> {
    const accountData = {
      routeId,
      customerName: account.customerName,
      customerEmail: account.email,
      customerPhone: account.phone,
      address: {
        street: account.street,
        city: account.city,
        state: account.state,
        zipCode: account.zipCode,
        country: 'USA',
        coordinates: account.coordinates
      },
      serviceType: account.serviceType as any,
      frequency: account.frequency as any,
      monthlyRate: account.monthlyRate,
      poolType: account.poolType as any,
      poolSize: account.poolSize as any,
      specialRequirements: account.notes,
      startDate: new Date()
    };

    return PoolAccountModel.createAccount(accountData);
  }

  private async createPoolAccountInTransaction(
    account: NormalizedAccount,
    routeId: string,
    trx: any
  ): Promise<any> {
    const accountData = {
      routeId,
      customerName: account.customerName,
      customerEmail: account.email,
      customerPhone: account.phone,
      address: {
        street: account.street,
        city: account.city,
        state: account.state,
        zipCode: account.zipCode,
        country: 'USA',
        coordinates: account.coordinates
      },
      serviceType: account.serviceType as any,
      frequency: account.frequency as any,
      monthlyRate: account.monthlyRate,
      poolType: account.poolType as any,
      poolSize: account.poolSize as any,
      specialRequirements: account.notes,
      startDate: new Date()
    };

    return PoolAccountModel.createAccountInTransaction(accountData, trx);
  }

  private async updateRouteStatsInTransaction(routeId: string, trx: any): Promise<void> {
    // Calculate and update route statistics within transaction
    const stats = await trx.raw(`
      SELECT
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
        COALESCE(SUM(CASE WHEN status = 'active' THEN monthly_rate ELSE 0 END), 0) as monthly_revenue,
        COALESCE(AVG(CASE WHEN status = 'active' THEN monthly_rate END), 0) as average_rate
      FROM pool_accounts
      WHERE route_id = ?
    `, [routeId]);

    const { total_accounts, active_accounts, monthly_revenue, average_rate } = stats.rows[0];

    await trx('routes')
      .where('id', routeId)
      .update({
        total_accounts: parseInt(total_accounts),
        active_accounts: parseInt(active_accounts),
        monthly_revenue: parseFloat(monthly_revenue),
        average_rate: parseFloat(average_rate),
        updated_at: new Date()
      });
  }

  private createFailedResult(
    importId: string,
    errors: ImportError[],
    metadata: ImportMetadata,
    progress: ImportProgress
  ): ImportResult {
    progress.status = ImportStatus.FAILED;
    progress.completedAt = new Date();

    return {
      success: false,
      status: ImportStatus.FAILED,
      importId,
      processedRecords: 0,
      createdAccounts: 0,
      updatedAccounts: 0,
      skippedAccounts: 0,
      errors,
      warnings: [],
      metadata,
      progress
    };
  }

  /**
   * Create batches from array to process in smaller chunks
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process a batch of accounts with transaction and retry support
   */
  private async processAccountBatchWithRetry(
    batch: NormalizedAccount[],
    startIndex: number,
    routeId: string,
    options: ImportOptions,
    duplicateResults: Map<number, any>,
    progress: ImportProgress,
    errors: ImportError[],
    warnings: ImportWarning[],
    importedAccounts: any[],
    counters: { createdAccounts: number; updatedAccounts: number; skippedAccounts: number }
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await PoolAccountModel.transaction(async (trx) => {
          // Set transaction isolation level for consistency
          await trx.raw('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

          for (let i = 0; i < batch.length; i++) {
            const account = batch[i];
            const globalIndex = startIndex + i;
            progress.currentRow = globalIndex + 1;

            try {
              // Check if this account is a duplicate
              const duplicateResult = duplicateResults.get(globalIndex);

              if (duplicateResult?.isDuplicate && duplicateResult.existingId) {
                // Handle duplicate based on strategy
                const action = await this.duplicateChecker.handleDuplicateInTransaction(
                  account,
                  duplicateResult.existingId,
                  options.duplicateStrategy,
                  trx
                );

                if (action.action === 'skipped') {
                  counters.skippedAccounts++;
                  warnings.push({
                    row: globalIndex + 2,
                    message: `Duplicate account skipped: ${account.customerName}`,
                    code: 'DUPLICATE_SKIPPED'
                  });
                } else if (action.action === 'updated') {
                  counters.updatedAccounts++;
                } else if (action.action === 'create_new') {
                  // Continue to create new account
                  const poolAccount = await this.createPoolAccountInTransaction(account, routeId, trx);
                  importedAccounts.push(poolAccount);
                  counters.createdAccounts++;
                }
              } else {
                // Create new account
                const poolAccount = await this.createPoolAccountInTransaction(account, routeId, trx);
                importedAccounts.push(poolAccount);
                counters.createdAccounts++;
              }

              progress.processedAccounts++;

            } catch (error: any) {
              errors.push({
                row: globalIndex + 2,
                message: `Failed to import account: ${error.message}`,
                code: 'IMPORT_ERROR'
              });
              progress.errors++;

              // Decide whether to continue or abort this batch
              if (errors.length > 50) {
                throw new Error(`Too many errors, aborting batch starting at row ${startIndex + 2}`);
              }
            }
          }

          console.log(`✅ Processed batch ${startIndex / 100 + 1} successfully (${batch.length} accounts)`);
        });

        return; // Success, exit retry loop

      } catch (error: any) {
        attempt++;
        console.error(`❌ Batch ${startIndex / 100 + 1} failed (attempt ${attempt}/${maxRetries}):`, error.message);

        if (attempt >= maxRetries) {
          // Final failure - add error for entire batch
          errors.push({
            message: `Batch processing failed after ${maxRetries} attempts: ${error.message}`,
            code: 'BATCH_FAILED'
          });
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Update route statistics with retry mechanism
   */
  private async updateRouteStatsWithRetry(routeId: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await PoolAccountModel.transaction(async (trx) => {
          await this.updateRouteStatsInTransaction(routeId, trx);
        });

        console.log(`✅ Route statistics updated for route ${routeId}`);
        return; // Success

      } catch (error: any) {
        attempt++;
        console.error(`❌ Route stats update failed (attempt ${attempt}/${maxRetries}):`, error.message);

        if (attempt >= maxRetries) {
          console.error(`❌ Failed to update route statistics after ${maxRetries} attempts`);
          // Don't throw here as import succeeded, just stats update failed
          return;
        }

        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
}