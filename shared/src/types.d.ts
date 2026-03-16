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
export declare enum UserRole {
    BUYER = "buyer",
    SELLER = "seller",
    OPERATOR = "operator",
    ADMIN = "admin"
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}
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
export declare enum ServiceType {
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly",
    ONETIME = "onetime"
}
export declare enum ServiceFrequency {
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly"
}
export declare enum PoolType {
    CHLORINE = "chlorine",
    SALTWATER = "saltwater",
    NATURAL = "natural"
}
export declare enum PoolSize {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    XLARGE = "xlarge"
}
export declare enum AccountStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    CANCELLED = "cancelled",
    PENDING = "pending"
}
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
    radius?: number;
}
export declare enum RouteStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    FOR_SALE = "for_sale",
    IN_ESCROW = "in_escrow",
    SOLD = "sold"
}
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
    serviceArea: ServiceArea;
    paymentHistory: PaymentHistoryRecord[];
    retentionRate: number;
    averageAccountAge: number;
    equipmentIncluded: boolean;
    customerTransition: boolean;
    escrowPeriod: number;
    retentionGuarantee: RetentionGuarantee;
    images?: string[];
    documents?: string[];
    status: ListingStatus;
    listedAt: Date;
    updatedAt: Date;
}
export declare enum ListingStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PENDING = "pending",
    IN_ESCROW = "in_escrow",
    SOLD = "sold",
    WITHDRAWN = "withdrawn"
}
export interface RetentionGuarantee {
    percentage: number;
    period: number;
    penaltyRate: number;
}
export interface PaymentHistoryRecord {
    accountId: string;
    date: Date;
    amount: number;
    status: PaymentStatus;
}
export declare enum PaymentStatus {
    PAID = "paid",
    LATE = "late",
    MISSED = "missed"
}
export interface RouteAnalysis {
    currentRoute: Route;
    targetRoute: Route;
    overlap: OverlapAnalysis;
    driveTime: DriveTimeAnalysis;
    financialImpact: FinancialImpact;
    recommendations: string[];
}
export interface OverlapAnalysis {
    overlappingAccounts: number;
    overlapPercentage: number;
    conflictingSchedules: number;
    geographicOverlap: number;
}
export interface DriveTimeAnalysis {
    currentAverageDriveTime: number;
    projectedAverageDriveTime: number;
    efficiencyGain: number;
    additionalMileage: number;
}
export interface FinancialImpact {
    additionalRevenue: number;
    operatingCostIncrease: number;
    netRevenueIncrease: number;
    paybackPeriod: number;
    roi: number;
}
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
export interface FileUpload {
    file: File;
    type: UploadType;
    metadata?: Record<string, any>;
}
export declare enum UploadType {
    ROUTE_CSV = "route_csv",
    ROUTE_PDF = "route_pdf",
    ROUTE_IMAGE = "route_image",
    LISTING_IMAGE = "listing_image",
    LISTING_DOCUMENT = "listing_document"
}
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
//# sourceMappingURL=types.d.ts.map