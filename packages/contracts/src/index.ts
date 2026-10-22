/**
 * Shared API contracts, DTO types, and domain models for Rentora Rental SaaS
 * Multi-Tenant SaaS with Super Admin Governance & Universal Activity Logging
 * Market: UAE (Default Currency: AED, Default Timezone: Asia/Dubai)
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'manager'
  | 'accountant'
  | 'hr'
  | 'viewer';

export type AppModule =
  | 'companies'
  | 'properties'
  | 'units'
  | 'tenants'
  | 'leases'
  | 'expenses'
  | 'rent'
  | 'dashboard'
  | 'reports'
  | 'users'
  | 'settings'
  | 'activity_logs';

export const ROLE_MODULE_PERMISSIONS: Record<UserRole, AppModule[]> = {
  super_admin: [
    'companies',
    'properties',
    'units',
    'tenants',
    'leases',
    'expenses',
    'rent',
    'dashboard',
    'reports',
    'users',
    'settings',
    'activity_logs',
  ],
  admin: [
    'properties',
    'units',
    'tenants',
    'leases',
    'expenses',
    'rent',
    'dashboard',
    'reports',
    'users',
    'settings',
    'activity_logs',
  ],
  owner: [
    'properties',
    'units',
    'tenants',
    'leases',
    'expenses',
    'rent',
    'dashboard',
    'reports',
    'users',
    'settings',
    'activity_logs',
  ],
  manager: [
    'properties',
    'units',
    'tenants',
    'leases',
    'dashboard',
    'reports',
    'activity_logs',
  ],
  accountant: [
    'rent',
    'expenses',
    'dashboard',
    'reports',
    'properties',
    'units',
    'leases',
  ],
  hr: [
    'users',
    'dashboard',
    'activity_logs',
  ],
  viewer: [
    'dashboard',
    'properties',
    'units',
    'leases',
    'reports',
  ],
};

export type UAEEmirate = 
  | 'Abu Dhabi'
  | 'Dubai'
  | 'Sharjah'
  | 'Ajman'
  | 'Umm Al-Quwain'
  | 'Ras Al Khaimah'
  | 'Fujairah';

export type PropertyType = 'residential' | 'commercial' | 'mixed_use' | 'villa' | 'apartment_building';
export type UnitOccupancyStatus = 'vacant' | 'occupied' | 'under_maintenance';
export type UnitType = 'residential' | 'commercial' | 'parking';

export type LeaseStatus = 'draft' | 'active' | 'expiring' | 'ended' | 'terminated';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export type ExpenseStatus = 'pending' | 'paid' | 'voided';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'cheque';

export type RentChargeStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'voided';

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'VOID' | string;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role?: UserRole;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  companyId?: string | null;
  companyName?: string;
  phoneNumber?: string;
  isSuperAdmin: boolean;
  permissions?: AppModule[];
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  isSuperAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface VatSettings {
  enabled: boolean;
  defaultRate: number; // e.g. 5.0 for 5%
  trn?: string; // UAE Tax Registration Number (15 digits)
  calculationMode: 'exclusive' | 'inclusive';
}

/**
 * Company Point of Contact (POC)
 */
export interface CompanyPoc {
  fullName: string;
  email: string;
  phone: string;
}

/**
 * Tenant Organization / Company Model
 */
export interface Company {
  id: string;
  name: string;
  slug?: string;
  tradeLicenseNo?: string;
  trn?: string; // UAE Tax Registration Number
  pocName?: string;
  pocEmail?: string;
  pocPhone?: string;
  address?: string;
  emirate?: UAEEmirate;
  currency?: string; // Default 'AED'
  defaultCurrency?: string; // Backwards compatible alias
  timeZone?: string; // Default 'Asia/Dubai'
  ownerId?: string; // Backwards compatible alias
  status?: 'active' | 'suspended' | 'pending';
  totalProperties?: number;
  totalUnits?: number;
  vatSettings?: VatSettings;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backwards compatibility alias for Workspace
 */
export type Workspace = Company;

/**
 * Universal User Model (Canonical table: users)
 */
export interface User {
  id: string;
  companyId?: string | null;
  workspaceId?: string | null; // Backwards compatible alias
  propertyId?: string | null;
  userId?: string; // Backwards compatible alias for id
  email?: string;
  userEmail?: string; // Backwards compatible alias
  fullName?: string;
  userName?: string; // Backwards compatible alias
  phoneNumber?: string;
  userPhone?: string; // Backwards compatible alias
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CompanyUser = User;
export type WorkspaceMember = User;

export interface Property {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string; // Same as id
  name: string;
  type: PropertyType;
  address: string;
  emirate: UAEEmirate;
  communityArea?: string;
  buildingReference?: string;
  totalUnits: number;
  notes?: string;
  isArchived: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId: string;
  unitNumber: string;
  type?: UnitType;
  floor?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  marketRent: string; // Fixed precision decimal string e.g. "75000.00"
  status: UnitOccupancyStatus;
  currentLeaseId?: string;
  currentTenantName?: string;
  paymentStatus?: 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'vacant';
  paidAmount?: string;
  dueAmount?: string;
  previousDuesMonths?: number;
  isShop?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  emiratesId?: string;
  passportNumber?: string;
  preferredContact: 'email' | 'phone' | 'whatsapp';
  emergencyContact?: string;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChequeScheduleItem {
  chequeNumber?: string;
  dueDate: string;
  amount: string;
  bankName?: string;
  notes?: string;
  proformaInvoiceNumber?: string;
}

export interface Lease {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string;
  unitId: string;
  unitIds?: string[];
  tenantId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  annualRent: string; // Fixed precision decimal string e.g. "80000.00"
  paymentFrequency: PaymentFrequency;
  numberOfCheques: number; // typically 1, 2, 4, 6 in UAE
  securityDeposit: string; // e.g. "4000.00"
  status: LeaseStatus;
  termsNotes?: string;
  contractUrl?: string;
  cheques?: ChequeScheduleItem[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string | null;
  name: string;
  color?: string; // hex color for badges
  isSystemDefault: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vendor {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string | null;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  serviceCategory?: string;
  trnOrTaxId?: string; // UAE Tax Registration Number (TRN)
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseAttachment {
  id: string;
  companyId?: string;
  propertyId?: string;
  expenseId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  signedUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface Expense {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId: string;
  unitId?: string | null;
  categoryId: string;
  vendorId?: string | null;
  description: string;
  amount: string; // Fixed precision decimal string e.g. "450.00"
  currency: string; // Default "AED"
  expenseDate: string; // YYYY-MM-DD
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string | null; // ISO 8601 UTC
  reference?: string; // Invoice # or receipt #
  notes?: string;
  attachments?: ExpenseAttachment[];
  voidReason?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentCharge {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId: string;
  leaseId: string;
  unitId: string;
  tenantId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: string; // Fixed precision decimal string e.g. "20000.00"
  paidAmount: string; // e.g. "0.00"
  outstandingAmount: string; // amount - paidAmount
  status: RentChargeStatus;
  notes?: string;
  invoiceNumber?: string;
  installmentIndex?: number;
  installmentTotal?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  companyId?: string;
  propertyId?: string;
  paymentId: string;
  rentChargeId: string;
  amount: string; // Fixed precision decimal string
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId: string;
  tenantId: string;
  unitId: string;
  amount: string; // e.g. "20000.00"
  currency: string;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  reference?: string; // Cheque # or Bank Transfer Reference
  notes?: string;
  subtotalAmount?: string; // Base amount before VAT
  vatRate?: number; // VAT percentage, default 5.0
  vatAmount?: string; // VAT Dirhams amount
  totalAmount?: string; // Total including VAT
  allocations: PaymentAllocation[];
  proofUrl?: string; // Data URL or storage URL for attached payment proof
  proofName?: string; // File name e.g. "cheque_copy_102.pdf"
  invoiceNumber?: string; // e.g. "INV-2026-0042"
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  period: string; // e.g. "2026-10" or "2026"
  currency: string;
  propertyCount: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number; // percentage e.g. 85.5
  rentDue: string;
  rentCollected: string;
  rentOutstanding: string;
  expensesPaid: string;
  pendingExpenses: string;
  netCashFlow: string; // rentCollected - expensesPaid
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    color: string;
    amount: string;
    percentage: number;
  }[];
  recentActivity: {
    id: string;
    type: 'rent_payment' | 'expense' | 'lease_created' | 'lease_expiry';
    title: string;
    subtitle: string;
    amount?: string;
    date: string;
    status: string;
  }[];
}

export interface RentArrearsItem {
  rentChargeId: string;
  companyId?: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  tenantName: string;
  tenantPhone: string;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  outstandingBalance: string;
  daysOverdue: number;
}

export interface FinancialReportSummary {
  periodLabel: string;
  currency: string;
  totalIncome: string;
  totalExpenses: string;
  netCashFlow: string;
  rentArrearsTotal: string;
  propertiesSummary: {
    propertyId: string;
    propertyName: string;
    income: string;
    expenses: string;
    net: string;
    occupiedUnits: number;
    totalUnits: number;
  }[];
}

export interface NotificationItem {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string | null;
  userId: string;
  type: 'lease_expiring' | 'rent_overdue' | 'expense_pending' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
}

/**
 * Universal Activity Log Item (Captures every mutation across all collections)
 */
export interface ActivityLogItem {
  id: string;
  companyId?: string;
  workspaceId?: string; // Deprecated alias
  propertyId?: string | null;
  collectionName?: string; // e.g. 'units', 'leases', 'expenses'
  entity?: string; // Backwards compatible alias
  recordId?: string;
  entityId?: string; // Backwards compatible alias
  action: ActivityAction;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  diff?: Record<string, { from: any; to: any }> | null;
  changes?: Record<string, { before: any; after: any }> | null;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  timestamp?: string;
}

export type AuditLogItem = ActivityLogItem;

/**
 * Super Admin DTOs
 */
export interface CreateCompanyDto {
  name: string;
  tradeLicenseNo?: string;
  trn?: string;
  emirate?: UAEEmirate;
  address?: string;
  defaultCurrency?: string;
  poc: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
  };
}

export interface UpdateCompanyDto {
  name?: string;
  tradeLicenseNo?: string;
  trn?: string;
  emirate?: UAEEmirate;
  address?: string;
  status?: 'active' | 'suspended';
  pocName?: string;
  pocEmail?: string;
  pocPhone?: string;
}

/**
 * Standard API Envelope
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: Array<{ field?: string; message: string }>;
  requestId: string;
}
