import { PoolAccount } from '../../../models/PoolAccount';
import {
  NormalizedAccount,
  DuplicateCheckResult,
  DuplicateStrategy
} from '../types/import.types';

export class DuplicateChecker {
  /**
   * Check if an account already exists in the database
   */
  async checkDuplicate(
    account: NormalizedAccount,
    routeId: string
  ): Promise<DuplicateCheckResult> {
    // Check for exact address match
    const exactMatch = await this.checkExactAddressMatch(account, routeId);
    if (exactMatch.isDuplicate) {
      return exactMatch;
    }

    // Check for phone number match (if provided)
    if (account.phone) {
      const phoneMatch = await this.checkPhoneMatch(account, routeId);
      if (phoneMatch.isDuplicate) {
        return phoneMatch;
      }
    }

    // Check for fuzzy name + similar address
    const fuzzyMatch = await this.checkFuzzyMatch(account, routeId);
    if (fuzzyMatch.isDuplicate) {
      return fuzzyMatch;
    }

    return { isDuplicate: false };
  }

  /**
   * Check for duplicates in a batch of accounts
   */
  async checkBatchDuplicates(
    accounts: NormalizedAccount[],
    routeId: string
  ): Promise<Map<number, DuplicateCheckResult>> {
    const results = new Map<number, DuplicateCheckResult>();

    // Check for duplicates within the batch first
    const internalDuplicates = this.findInternalDuplicates(accounts);
    internalDuplicates.forEach((indices, key) => {
      if (indices.length > 1) {
        // Mark all but the first as duplicates
        indices.slice(1).forEach(index => {
          results.set(index, {
            isDuplicate: true,
            matchType: 'exact',
            confidence: 100
          });
        });
      }
    });

    // Check against database
    for (let i = 0; i < accounts.length; i++) {
      if (!results.has(i)) {
        const result = await this.checkDuplicate(accounts[i], routeId);
        if (result.isDuplicate) {
          results.set(i, result);
        }
      }
    }

    return results;
  }

  /**
   * Handle duplicates based on strategy
   */
  async handleDuplicate(
    account: NormalizedAccount,
    existingId: string,
    strategy: DuplicateStrategy
  ): Promise<{ action: string; accountId?: string }> {
    switch (strategy) {
      case DuplicateStrategy.SKIP:
        return { action: 'skipped', accountId: existingId };

      case DuplicateStrategy.UPDATE:
        // Update existing account
        await PoolAccount.updateById(existingId, {
          monthly_rate: account.monthlyRate,
          service_type: account.serviceType,
          frequency: account.frequency,
          pool_type: account.poolType,
          pool_size: account.poolSize,
          customer_email: account.email,
          customer_phone: account.phone,
          special_requirements: account.notes
        });
        return { action: 'updated', accountId: existingId };

      case DuplicateStrategy.CREATE_NEW:
        // Allow creation of a new account (will be handled by caller)
        return { action: 'create_new' };

      case DuplicateStrategy.FAIL:
        throw new Error(`Duplicate account found: ${account.customerName} at ${account.street}`);

      default:
        return { action: 'skipped', accountId: existingId };
    }
  }

  /**
   * Handle duplicates based on strategy within a transaction
   */
  async handleDuplicateInTransaction(
    account: NormalizedAccount,
    existingId: string,
    strategy: DuplicateStrategy,
    trx: any
  ): Promise<{ action: string; accountId?: string }> {
    switch (strategy) {
      case DuplicateStrategy.SKIP:
        return { action: 'skipped', accountId: existingId };

      case DuplicateStrategy.UPDATE:
        // Update existing account within transaction
        await trx('pool_accounts')
          .where('id', existingId)
          .update({
            monthly_rate: account.monthlyRate,
            service_type: account.serviceType,
            frequency: account.frequency,
            pool_type: account.poolType,
            pool_size: account.poolSize,
            customer_email: account.email,
            customer_phone: account.phone,
            special_requirements: account.notes,
            updated_at: new Date()
          });
        return { action: 'updated', accountId: existingId };

      case DuplicateStrategy.CREATE_NEW:
        // Allow creation of a new account (will be handled by caller)
        return { action: 'create_new' };

      case DuplicateStrategy.FAIL:
        throw new Error(`Duplicate account found: ${account.customerName} at ${account.street}`);

      default:
        return { action: 'skipped', accountId: existingId };
    }
  }

  private async checkExactAddressMatch(
    account: NormalizedAccount,
    routeId: string
  ): Promise<DuplicateCheckResult> {
    const existingAccounts = await PoolAccount.searchAccounts({
      routeId,
      customerName: account.customerName
    });

    const match = existingAccounts.find(existing =>
      this.normalizeAddress(existing.address.street) === this.normalizeAddress(account.street) &&
      existing.address.city.toLowerCase() === account.city.toLowerCase() &&
      existing.address.state === account.state &&
      this.normalizeZip(existing.address.zipCode) === this.normalizeZip(account.zipCode)
    );

    if (match) {
      return {
        isDuplicate: true,
        existingId: match.id,
        matchType: 'exact',
        confidence: 100
      };
    }

    return { isDuplicate: false };
  }

  private async checkPhoneMatch(
    account: NormalizedAccount,
    routeId: string
  ): Promise<DuplicateCheckResult> {
    if (!account.phone) {
      return { isDuplicate: false };
    }

    const normalizedPhone = this.normalizePhone(account.phone);
    const existingAccounts = await PoolAccount.findByRouteId(routeId);

    const match = existingAccounts.find(existing => {
      if (!existing.customerPhone) return false;
      return this.normalizePhone(existing.customerPhone) === normalizedPhone;
    });

    if (match) {
      return {
        isDuplicate: true,
        existingId: match.id,
        matchType: 'phone',
        confidence: 90
      };
    }

    return { isDuplicate: false };
  }

  private async checkFuzzyMatch(
    account: NormalizedAccount,
    routeId: string
  ): Promise<DuplicateCheckResult> {
    const existingAccounts = await PoolAccount.findByRouteId(routeId);

    for (const existing of existingAccounts) {
      // Check for similar name and address
      const nameSimilarity = this.calculateSimilarity(
        account.customerName.toLowerCase(),
        existing.customerName.toLowerCase()
      );

      const addressSimilarity = this.calculateSimilarity(
        this.normalizeAddress(account.street),
        this.normalizeAddress(existing.address.street)
      );

      // If name is very similar and address is somewhat similar, it's likely a duplicate
      if (nameSimilarity > 0.85 && addressSimilarity > 0.7) {
        return {
          isDuplicate: true,
          existingId: existing.id,
          matchType: 'fuzzy',
          confidence: Math.round((nameSimilarity + addressSimilarity) / 2 * 100)
        };
      }

      // If address is identical but name is slightly different (typo, nickname)
      if (addressSimilarity > 0.95 && nameSimilarity > 0.6) {
        return {
          isDuplicate: true,
          existingId: existing.id,
          matchType: 'address',
          confidence: Math.round(addressSimilarity * 100)
        };
      }
    }

    return { isDuplicate: false };
  }

  private findInternalDuplicates(accounts: NormalizedAccount[]): Map<string, number[]> {
    const duplicateMap = new Map<string, number[]>();

    accounts.forEach((account, index) => {
      const key = `${this.normalizeAddress(account.street)}|${account.city.toLowerCase()}|${account.state}|${this.normalizeZip(account.zipCode)}`;

      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(index);
    });

    return duplicateMap;
  }

  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\bapt\b/g, 'apartment')
      .replace(/\bave\b/g, 'avenue')
      .replace(/\bblvd\b/g, 'boulevard')
      .replace(/\bct\b/g, 'court')
      .replace(/\bdr\b/g, 'drive')
      .replace(/\bln\b/g, 'lane')
      .replace(/\bpkwy\b/g, 'parkway')
      .replace(/\bpl\b/g, 'place')
      .replace(/\brd\b/g, 'road')
      .replace(/\bst\b/g, 'street')
      .replace(/\bste\b/g, 'suite')
      .trim();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private normalizeZip(zip: string): string {
    return zip.replace(/\D/g, '').slice(0, 5);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance-based similarity
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}