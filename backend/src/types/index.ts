// Local types for backend (copied from shared to avoid path mapping issues in MVP)

// User Management Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  OPERATOR = 'operator',
  ADMIN = 'admin'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Geospatial Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  coordinates?: Coordinates;
}

// Pool Account Types
export interface PoolAccount {
  id: string;
  routeId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address: Address;
  serviceType: ServiceType;
  frequency: ServiceFrequency;
  monthlyRate: number;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  poolType: PoolType;
  poolSize?: PoolSize;
  equipmentNotes?: string;
  accessInstructions?: string;
  specialRequirements?: string;
  status: AccountStatus;
  startDate: Date;
  endDate?: Date;
  churnReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceType {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  ONETIME = 'onetime'
}

export enum ServiceFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly'
}

export enum PoolType {
  CHLORINE = 'chlorine',
  SALTWATER = 'saltwater',
  NATURAL = 'natural'
}

export enum PoolSize {
  SMALL = 'small',     // < 15,000 gallons
  MEDIUM = 'medium',   // 15,000 - 25,000 gallons
  LARGE = 'large',     // 25,000 - 40,000 gallons
  XLARGE = 'xlarge'    // > 40,000 gallons
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

// Route Types
export interface Route {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  serviceArea: ServiceArea;
  accounts: PoolAccount[];
  totalAccounts: number;
  activeAccounts: number;
  monthlyRevenue: number;
  averageRate: number;
  isForSale: boolean;
  askingPrice?: number;
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceArea {
  name: string;
  boundaries: Coordinates[];
  centerPoint: Coordinates;
  radius?: number; // in miles
}

export enum RouteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FOR_SALE = 'for_sale',
  IN_ESCROW = 'in_escrow',
  SOLD = 'sold'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// File Upload Types
export interface FileUpload {
  file: File;
  type: UploadType;
  metadata?: Record<string, any>;
}

export enum UploadType {
  ROUTE_CSV = 'route_csv',
  ROUTE_PDF = 'route_pdf',
  ROUTE_IMAGE = 'route_image',
  LISTING_IMAGE = 'listing_image',
  LISTING_DOCUMENT = 'listing_document'
}

// Import Types
export interface ImportResult {
  success: boolean;
  processedRecords: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  previewData?: PoolAccount[];
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  value: string;
  message: string;
}