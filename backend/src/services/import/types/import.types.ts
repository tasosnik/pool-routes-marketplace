import { PoolAccount, Route } from '../../../types';

// Parser interface for different file formats
export interface IParser<T = any> {
  parse(buffer: Buffer, options?: ParserOptions): Promise<ParseResult<T>>;
  validate(data: T[]): ValidationResult;
}

export interface ParserOptions {
  encoding?: BufferEncoding;
  delimiter?: string;
  hasHeaders?: boolean;
  columnMapping?: Record<string, string>;
  skipRows?: number;
  maxRows?: number;
}

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  metadata: ImportMetadata;
}

export interface ImportMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  rowCount: number;
  parsedAt: Date;
  processingTime: number;
}

// Normalized data structures
export interface NormalizedAccount {
  customerName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  email?: string;
  phone?: string;
  serviceType: string;
  frequency: string;
  monthlyRate: number;
  poolType: string;
  poolSize?: string;
  notes?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface NormalizedRoute {
  name: string;
  description?: string;
  accounts: NormalizedAccount[];
}

export interface ImportData {
  routes: NormalizedRoute[];
  accounts: NormalizedAccount[];
  metadata: ImportMetadata;
}

// Validation structures
export interface ValidationResult {
  valid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  stats: ValidationStats;
}

export interface ImportError {
  row?: number;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

export interface ImportWarning {
  row?: number;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

export interface ValidationStats {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicates: number;
  skipped: number;
}

// Import processing
export interface ImportOptions {
  userId: string;
  routeId?: string;
  routeName?: string;
  duplicateStrategy: DuplicateStrategy;
  validateOnly: boolean;
  skipGeocoding?: boolean;
  batchSize?: number;
}

export enum DuplicateStrategy {
  SKIP = 'skip',
  UPDATE = 'update',
  CREATE_NEW = 'create_new',
  FAIL = 'fail'
}

export interface ImportProgress {
  status: ImportStatus;
  currentRow: number;
  totalRows: number;
  processedAccounts: number;
  errors: number;
  warnings: number;
  startedAt: Date;
  completedAt?: Date;
}

export enum ImportStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  GEOCODING = 'geocoding',
  SAVING = 'saving',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL_SUCCESS = 'partial_success'
}

export interface ImportResult {
  success: boolean;
  status: ImportStatus;
  importId: string;
  processedRecords: number;
  createdAccounts: number;
  updatedAccounts: number;
  skippedAccounts: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  route?: Route;
  accounts?: PoolAccount[];
  metadata: ImportMetadata;
  progress: ImportProgress;
}

// Duplicate detection
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
  matchType?: 'exact' | 'fuzzy' | 'address' | 'phone';
  confidence?: number;
}

// Geocoding
export interface GeocodingResult {
  success: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  confidence?: number;
  provider?: string;
}

// Import log for audit trail
export interface ImportLog {
  id: string;
  userId: string;
  routeId?: string;
  fileName: string;
  fileSize: number;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  createdAccounts: number;
  updatedAccounts: number;
  skippedAccounts: number;
  errors: number;
  warnings: number;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}