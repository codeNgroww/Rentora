import {
  Workspace,
  Property,
  Unit,
  Tenant,
  Lease,
  Expense,
  ExpenseCategory,
  Vendor,
  RentCharge,
  Payment,
  DashboardSummary,
  FinancialReportSummary,
  RentArrearsItem,
  NotificationItem,
  AuditLogItem,
} from '@rental-saas/contracts';

export const INITIAL_WORKSPACE: Workspace = {
  id: '',
  name: 'Rentora Property Management',
  slug: 'rentora-pm',
  defaultCurrency: 'AED',
  timeZone: 'Asia/Dubai',
  ownerId: '',
  vatSettings: {
    enabled: true,
    defaultRate: 5.0,
    trn: '',
    calculationMode: 'exclusive',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_PROPERTIES: Property[] = [];

export const INITIAL_UNITS: Unit[] = [];

export const INITIAL_TENANTS: Tenant[] = [];

export const INITIAL_LEASES: Lease[] = [];

export const INITIAL_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'c1',
    name: 'Maintenance & Repairs',
    color: '#10b981',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Utilities (DEWA/ADDC)',
    color: '#0284c7',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'Cleaning & Sanitation',
    color: '#8b5cf6',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c4',
    name: 'Management Fees',
    color: '#f59e0b',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c5',
    name: 'Building Insurance',
    color: '#ef4444',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c6',
    name: 'Service Charges',
    color: '#06b6d4',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c7',
    name: 'Supplies & Tools',
    color: '#64748b',
    isSystemDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_RENT_CHARGES: RentCharge[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_DASHBOARD_SUMMARY: DashboardSummary = {
  workspaceId: '',
  period: new Date().toISOString().slice(0, 7),
  currency: 'AED',
  propertyCount: 0,
  totalUnits: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  occupancyRate: 0,
  rentDue: '0.00',
  rentCollected: '0.00',
  rentOutstanding: '0.00',
  expensesPaid: '0.00',
  pendingExpenses: '0.00',
  netCashFlow: '0.00',
  categoryBreakdown: [],
  recentActivity: [],
};
