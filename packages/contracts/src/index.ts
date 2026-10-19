/**
 * Shared API contracts, DTO types, and domain models for Rental Property Management SaaS
 * Market: UAE (Default Currency: AED, Default Timezone: Asia/Dubai)
 */

export type UserRole = 'owner' | 'manager' | 'accountant';

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

export type LeaseStatus = 'draft' | 'active' | 'expiring' | 'ended' | 'terminated';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export type ExpenseStatus = 'pending' | 'paid' | 'voided';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'cheque';

export type RentChargeStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'voided';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface VatSettings {
  enabled: boolean;
  defaultRate: number; // e.g. 5.0 for 5%
  trn?: string; // UAE Tax Registration Number (15 digits)
  calculationMode: 'exclusive' | 'inclusive';
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  defaultCurrency: string; // e.g., 'AED'
  timeZone: string; // e.g., 'Asia/Dubai'
  ownerId: string;
  vatSettings?: VatSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  createdAt: string;
}

export interface Property {
  id: string;
  workspaceId: string;
  name: string;
  type: PropertyType;
  address: string;
  emirate: UAEEmirate;
  communityArea?: string;
  buildingReference?: string;
  totalUnits: number;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UnitType = 'residential' | 'commercial';

export interface Unit {
  id: string;
  workspaceId: string;
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
  createdAt: string;
  updatedAt: string;
  currentTenantName?: string;
  paymentStatus?: 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'vacant';
  paidAmount?: string;
  dueAmount?: string;
  previousDuesMonths?: number;
  isShop?: boolean;
}

export interface Tenant {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  emiratesId?: string;
  passportNumber?: string;
  preferredContact: 'email' | 'phone' | 'whatsapp';
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
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
  workspaceId: string;
  unitId: string;
  unitIds?: string[];
  propertyId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  workspaceId: string;
  name: string;
  color?: string; // hex color for badges
  isSystemDefault: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  workspaceId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  serviceCategory?: string;
  trnOrTaxId?: string; // UAE Tax Registration Number (TRN)
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseAttachment {
  id: string;
  expenseId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  signedUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Expense {
  id: string;
  workspaceId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface RentCharge {
  id: string;
  workspaceId: string;
  leaseId: string;
  propertyId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  rentChargeId: string;
  amount: string; // Fixed precision decimal string
  createdAt: string;
}

export interface Payment {
  id: string;
  workspaceId: string;
  tenantId: string;
  propertyId: string;
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
  createdAt: string;
}

export interface DashboardSummary {
  workspaceId: string;
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
  workspaceId: string;
  userId: string;
  type: 'lease_expiring' | 'rent_overdue' | 'expense_pending' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  changes?: Record<string, { before: any; after: any }>;
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
