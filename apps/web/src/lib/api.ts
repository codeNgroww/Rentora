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
  VatSettings,
} from '@rental-saas/contracts';

import { clientDemoStore } from './demoStore';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:4000/api/v1');
const WORKSPACE_ID = 'w1111111-1111-4111-8111-111111111111';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-workspace-id': WORKSPACE_ID,
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error) {
    // If backend is unreachable or returns error (e.g. on Netlify demo deployment),
    // gracefully serve from client-side DemoStore so demo works 100% out-of-the-box!
    try {
      const demoResult = clientDemoStore.handle<T>(endpoint, options);
      if (demoResult !== null && demoResult !== undefined) {
        return demoResult;
      }
    } catch (fallbackErr) {
      console.warn('[DemoStore Fallback Error]:', fallbackErr);
    }
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboard: (period = '2026-10') =>
    request<DashboardSummary>(`/dashboard/summary?period=${period}`),

  // Properties
  getProperties: () => request<Property[]>('/properties'),
  createProperty: (data: Partial<Property>) =>
    request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProperty: (id: string) => request<Property & { units: Unit[] }>(`/properties/${id}`),

  // Units
  getUnits: (propertyId?: string) =>
    request<Unit[]>(propertyId ? `/units?propertyId=${propertyId}` : '/units'),
  createUnit: (propertyId: string, data: Partial<Unit>) =>
    request<Unit>(`/properties/${propertyId}/units`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tenants & Leases
  getTenants: () => request<Tenant[]>('/tenants'),
  createTenant: (data: Partial<Tenant>) =>
    request<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLeases: () => request<Lease[]>('/leases'),
  createLease: (data: Partial<Lease>) =>
    request<Lease>('/leases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses (Reference Core)
  getExpenses: (params?: {
    from?: string;
    to?: string;
    propertyId?: string;
    categoryId?: string;
    status?: string;
    includeVoided?: boolean;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.propertyId) query.set('propertyId', params.propertyId);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.status) query.set('status', params.status);
    if (params?.includeVoided) query.set('includeVoided', 'true');
    if (params?.search) query.set('search', params.search);

    return request<Expense[]>(`/expenses?${query.toString()}`);
  },
  createExpense: (data: Partial<Expense>) =>
    request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  voidExpense: (id: string, reason: string) =>
    request<Expense>(`/expenses/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getCategories: () => request<ExpenseCategory[]>('/expense-categories'),
  getVendors: () => request<Vendor[]>('/vendors'),

  // Rent & Payments
  getRentCharges: (status?: string) =>
    request<RentCharge[]>(status ? `/rent-charges?status=${status}` : '/rent-charges'),
  createRentCharge: (data: Partial<RentCharge>) =>
    request<RentCharge>('/rent-charges', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayments: () => request<Payment[]>('/payments'),
  recordPayment: (data: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    amount: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    subtotalAmount?: string;
    vatRate?: number;
    vatAmount?: string;
    totalAmount?: string;
  }) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getFinancialSummary: (from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return request<FinancialReportSummary>(`/reports/summary?${query.toString()}`);
  },
  getRentArrears: () => request<RentArrearsItem[]>('/reports/rent-arrears'),

  // Notifications & Audit
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  getAuditLogs: () => request<AuditLogItem[]>('/audit-logs'),

  // Workspace Settings & Master VAT
  getWorkspaceSettings: () =>
    request<{
      workspaceId: string;
      name: string;
      defaultCurrency: string;
      timeZone: string;
      vatSettings: VatSettings;
    }>('/workspaces/settings'),
  updateWorkspaceSettings: (settings: {
    name?: string;
    defaultCurrency?: string;
    timeZone?: string;
    vatSettings?: Partial<VatSettings>;
  }) =>
    request<{
      workspaceId: string;
      name: string;
      defaultCurrency: string;
      timeZone: string;
      vatSettings: VatSettings;
    }>('/workspaces/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
};

