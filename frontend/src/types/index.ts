// Local types for frontend (copied from shared to avoid path mapping issues in MVP)

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

// Marketplace Types
export interface RouteListing {
  id: string;
  routeId: string;
  sellerId: string;
  title: string;
  description: string;
  askingPrice: number;
  accountCount: number;
  monthlyRevenue: number;
  revenueMultiple: number;
  retentionRate: number;
  averageAccountAge: number;
  equipmentIncluded: boolean;
  customerTransition: boolean;
  escrowPeriod: number;
  retentionGuaranteePercentage: number;
  retentionGuaranteePeriod: number;
  retentionPenaltyRate: number;
  images?: string[];
  documents?: string[];
  status: ListingStatus;
  listedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Joined data (using any for flexible partial data)
  route?: any;
  seller?: any;
}

export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PENDING = 'pending',
  IN_ESCROW = 'in_escrow',
  SOLD = 'sold',
  WITHDRAWN = 'withdrawn'
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