import {
  INITIAL_WORKSPACE,
  INITIAL_PROPERTIES,
  INITIAL_UNITS,
  INITIAL_TENANTS,
  INITIAL_LEASES,
  INITIAL_CATEGORIES,
  INITIAL_VENDORS,
  INITIAL_EXPENSES,
  INITIAL_RENT_CHARGES,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DASHBOARD_SUMMARY,
} from './mockData';
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

interface DemoStoreState {
  workspace: Workspace;
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  categories: ExpenseCategory[];
  vendors: Vendor[];
  expenses: Expense[];
  rentCharges: RentCharge[];
  payments: Payment[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

const STORAGE_KEY = 'rentora_demo_store_v1';

class DemoStore {
  private state: DemoStoreState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DemoStoreState {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('Could not read from localStorage, using in-memory state', e);
      }
    }
    return {
      workspace: { ...INITIAL_WORKSPACE },
      properties: [...INITIAL_PROPERTIES],
      units: [...INITIAL_UNITS],
      tenants: [...INITIAL_TENANTS],
      leases: [...INITIAL_LEASES],
      categories: [...INITIAL_CATEGORIES],
      vendors: [...INITIAL_VENDORS],
      expenses: [...INITIAL_EXPENSES],
      rentCharges: [...INITIAL_RENT_CHARGES],
      payments: [...INITIAL_PAYMENTS],
      notifications: [...INITIAL_NOTIFICATIONS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
    };
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn('Could not persist to localStorage', e);
      }
    }
  }

  public handle<T>(endpoint: string, options: RequestInit = {}): T {
    const method = (options.method || 'GET').toUpperCase();
    const [path, queryString] = endpoint.split('?');
    const params = new URLSearchParams(queryString || '');
    let body: any = null;
    if (options.body && typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch {
        body = null;
      }
    }

    // --- Dashboard ---
    if (path === '/dashboard/summary') {
      const activeExpenses = this.state.expenses.filter((e) => e.status !== 'voided');
      const expensesPaid = activeExpenses
        .filter((e) => e.status === 'paid')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const rentCollected = this.state.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );
      const arrearsTotal = this.state.rentCharges
        .filter((c) => c.status === 'overdue' || c.status === 'partially_paid')
        .reduce((sum, c) => sum + parseFloat(c.outstandingAmount || c.amount), 0);
      const arrearsCount = this.state.rentCharges.filter(
        (c) => c.status === 'overdue'
      ).length;

      const summary: DashboardSummary = {
        propertyCount: this.state.properties.length,
        unitCount: this.state.units.length,
        occupancyRate: 85.3,
        rentCollected,
        expensesPaid,
        netCashFlow: rentCollected - expensesPaid,
        arrearsTotal,
        arrearsCount,
        period: params.get('period') || '2026-10',
        currency: 'AED',
      };
      return summary as unknown as T;
    }

    // --- Properties ---
    if (path === '/properties') {
      if (method === 'POST') {
        const newProp: Property = {
          id: `p-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          name: body.name || 'New Property',
          type: body.type || 'apartment_building',
          address: body.address || 'Dubai, UAE',
          emirate: body.emirate || 'Dubai',
          communityArea: body.communityArea || '',
          buildingReference: body.buildingReference || `BLDG-${Date.now()}`,
          totalUnits: 0,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.properties.push(newProp);
        this.persist();
        return newProp as unknown as T;
      }
      return this.state.properties as unknown as T;
    }

    if (path.startsWith('/properties/') && !path.includes('/units')) {
      const id = path.replace('/properties/', '');
      const prop = this.state.properties.find((p) => p.id === id);
      const propUnits = this.state.units.filter((u) => u.propertyId === id);
      return { ...prop, units: propUnits } as unknown as T;
    }

    // --- Units ---
    if (path === '/units') {
      const propId = params.get('propertyId');
      if (propId) {
        return this.state.units.filter((u) => u.propertyId === propId) as unknown as T;
      }
      return this.state.units as unknown as T;
    }

    if (path.includes('/properties/') && path.endsWith('/units') && method === 'POST') {
      const propId = path.split('/')[2];
      const newUnit: Unit = {
        id: `u-${Date.now()}`,
        workspaceId: this.state.workspace.id,
        propertyId: propId,
        unitNumber: body.unitNumber || '101',
        floor: body.floor || '1st Floor',
        bedrooms: body.bedrooms || 1,
        bathrooms: body.bathrooms || 1,
        squareFeet: body.squareFeet || 800,
        marketRent: body.marketRent || '5000.00',
        status: 'vacant',
        paymentStatus: 'vacant',
        paidAmount: '0.00',
        dueAmount: '0.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.units.push(newUnit);
      this.persist();
      return newUnit as unknown as T;
    }

    // --- Tenants ---
    if (path === '/tenants') {
      if (method === 'POST') {
        const newTenant: Tenant = {
          id: `t-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          fullName: body.fullName || 'Tenant Name',
          email: body.email || '',
          phoneNumber: body.phoneNumber || '',
          emiratesId: body.emiratesId || '',
          passportNumber: body.passportNumber || '',
          preferredContact: body.preferredContact || 'email',
          createdAt: new Date().toISOString(),
        };
        this.state.tenants.push(newTenant);
        this.persist();
        return newTenant as unknown as T;
      }
      return this.state.tenants as unknown as T;
    }

    // --- Leases ---
    if (path === '/leases') {
      if (method === 'POST') {
        const newLease: Lease = {
          id: `l-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          unitId: body.unitId,
          propertyId: body.propertyId,
          tenantId: body.tenantId,
          startDate: body.startDate || '2026-10-01',
          endDate: body.endDate || '2027-09-30',
          annualRent: body.annualRent || '60000.00',
          paymentFrequency: body.paymentFrequency || 'quarterly',
          numberOfCheques: body.numberOfCheques || 4,
          securityDeposit: body.securityDeposit || '3000.00',
          status: 'active',
          termsNotes: body.termsNotes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.leases.push(newLease);
        // Mark unit as occupied
        const u = this.state.units.find((unit) => unit.id === body.unitId);
        if (u) {
          u.status = 'occupied';
          const t = this.state.tenants.find((tenant) => tenant.id === body.tenantId);
          u.currentTenantName = t?.fullName || 'Tenant';
        }
        this.persist();
        return newLease as unknown as T;
      }
      return this.state.leases as unknown as T;
    }

    // --- Categories & Vendors ---
    if (path === '/expense-categories') {
      return this.state.categories as unknown as T;
    }
    if (path === '/vendors') {
      return this.state.vendors as unknown as T;
    }

    // --- Expenses ---
    if (path === '/expenses') {
      if (method === 'POST') {
        const cat = this.state.categories.find((c) => c.id === body.categoryId);
        const prop = this.state.properties.find((p) => p.id === body.propertyId);
        const unit = body.unitId ? this.state.units.find((u) => u.id === body.unitId) : null;
        const vendor = body.vendorId ? this.state.vendors.find((v) => v.id === body.vendorId) : null;

        const newExpense: Expense = {
          id: `e-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          propertyId: body.propertyId,
          unitId: body.unitId || null,
          categoryId: body.categoryId,
          vendorId: body.vendorId || null,
          description: body.description,
          amount: parseFloat(body.amount || '0').toFixed(2),
          currency: body.currency || 'AED',
          expenseDate: body.expenseDate || new Date().toISOString().slice(0, 10),
          status: body.status || 'paid',
          paymentMethod: body.paymentMethod || 'bank_transfer',
          paidAt: body.status === 'paid' ? new Date().toISOString() : null,
          reference: body.reference || '',
          notes: body.notes || '',
          categoryName: cat?.name || 'Uncategorized',
          categoryColor: cat?.color || '#10b981',
          propertyName: prop?.name || 'Marina Crown Tower',
          unitNumber: unit ? unit.unitNumber : null,
          vendorName: vendor ? vendor.name : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.expenses.unshift(newExpense);
        // Add audit log
        this.state.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          actorId: 'system',
          actorName: 'Authorized User',
          action: 'EXPENSE_CREATED',
          entity: 'Expense',
          entityId: newExpense.id,
          timestamp: new Date().toISOString(),
          changes: {
            description: { before: null, after: newExpense.description },
            amount: { before: null, after: newExpense.amount },
          },
        });
        this.persist();
        return newExpense as unknown as T;
      }

      // GET /expenses
      let list = [...this.state.expenses];
      if (params.get('includeVoided') !== 'true' && !params.get('status')) {
        list = list.filter((e) => e.status !== 'voided');
      }
      if (params.get('status')) {
        list = list.filter((e) => e.status === params.get('status'));
      }
      if (params.get('propertyId')) {
        list = list.filter((e) => e.propertyId === params.get('propertyId'));
      }
      if (params.get('categoryId')) {
        list = list.filter((e) => e.categoryId === params.get('categoryId'));
      }
      if (params.get('search')) {
        const q = params.get('search')!.toLowerCase();
        list = list.filter((e) => e.description.toLowerCase().includes(q));
      }
      return list as unknown as T;
    }

    if (path.startsWith('/expenses/') && path.endsWith('/void')) {
      const id = path.split('/')[2];
      const expense = this.state.expenses.find((e) => e.id === id);
      if (expense) {
        expense.status = 'voided';
        expense.voidReason = body?.reason || 'Voided by user request';
        this.state.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          actorId: 'system',
          actorName: 'Authorized User',
          action: 'EXPENSE_VOIDED',
          entity: 'Expense',
          entityId: expense.id,
          timestamp: new Date().toISOString(),
          changes: {
            status: { before: 'paid', after: 'voided' },
            reason: { before: null, after: expense.voidReason },
          },
        });
        this.persist();
      }
      return expense as unknown as T;
    }

    // --- Rent Charges & Payments ---
    if (path === '/rent-charges') {
      if (method === 'POST') {
        const newCharge: RentCharge = {
          id: `rc-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          leaseId: body.leaseId,
          dueDate: body.dueDate,
          amount: parseFloat(body.amount).toFixed(2),
          paidAmount: '0.00',
          outstandingAmount: parseFloat(body.amount).toFixed(2),
          status: 'pending',
          notes: body.notes || '',
          periodStart: body.dueDate,
          periodEnd: body.dueDate,
          propertyId: 'p1',
          unitId: 'u101',
          tenantId: 't1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.rentCharges.push(newCharge);
        this.persist();
        return newCharge as unknown as T;
      }
      return this.state.rentCharges.map((c) => {
        const t = this.state.tenants.find((tn) => tn.id === c.tenantId);
        const p = this.state.properties.find((pr) => pr.id === c.propertyId);
        const u = this.state.units.find((un) => un.id === c.unitId);
        return {
          ...c,
          tenantName: t?.fullName || 'Tenant',
          propertyName: p?.name || 'Property',
          unitNumber: u?.unitNumber || '',
        };
      }) as unknown as T;
    }

    if (path === '/payments') {
      if (method === 'POST') {
        const amt = parseFloat(body.amount);
        const newPayment: Payment = {
          id: `pay-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          tenantId: body.tenantId,
          propertyId: body.propertyId,
          unitId: body.unitId,
          amount: amt.toFixed(2),
          currency: 'AED',
          paymentDate: body.paymentDate || new Date().toISOString().slice(0, 10),
          paymentMethod: body.paymentMethod || 'cheque',
          reference: body.reference || '',
          notes: body.notes || '',
          subtotalAmount: body.subtotalAmount || amt.toFixed(2),
          vatRate: body.vatRate || 5.0,
          vatAmount: body.vatAmount || '0.00',
          totalAmount: body.totalAmount || amt.toFixed(2),
          allocations: [],
          createdAt: new Date().toISOString(),
        };
        this.state.payments.unshift(newPayment);

        // Update overdue unit status if matched
        const u = this.state.units.find((unit) => unit.id === body.unitId);
        if (u) {
          u.paymentStatus = 'paid';
          u.paidAmount = amt.toFixed(2);
          u.dueAmount = '0.00';
        }

        // Add audit log
        this.state.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          workspaceId: this.state.workspace.id,
          actorId: 'system',
          actorName: 'Authorized User',
          action: 'PAYMENT_RECORDED',
          entity: 'Payment',
          entityId: newPayment.id,
          timestamp: new Date().toISOString(),
          changes: {
            amount: { before: null, after: newPayment.amount },
            tenantId: { before: null, after: newPayment.tenantId },
          },
        });
        this.persist();
        return newPayment as unknown as T;
      }
      return this.state.payments.map((p) => {
        const t = this.state.tenants.find((tn) => tn.id === p.tenantId);
        const pr = this.state.properties.find((prop) => prop.id === p.propertyId);
        const u = this.state.units.find((un) => un.id === p.unitId);
        return {
          ...p,
          tenantName: t?.fullName || 'Tenant',
          propertyName: pr?.name || 'Property',
          unitNumber: u?.unitNumber || '',
        };
      }) as unknown as T;
    }

    // --- Reports ---
    if (path === '/reports/summary') {
      const rep: FinancialReportSummary = {
        totalRevenue: 21250.0,
        totalExpenses: 9840.5,
        netIncome: 11409.5,
        outstandingReceivables: 36250.0,
        byCategory: [
          { categoryName: 'Utilities (DEWA/ADDC)', totalAmount: 3240.5, percentage: 33.0 },
          { categoryName: 'Service Charges', totalAmount: 4650.0, percentage: 47.0 },
          { categoryName: 'Cleaning & Sanitation', totalAmount: 1100.0, percentage: 11.0 },
          { categoryName: 'Maintenance & Repairs', totalAmount: 850.0, percentage: 9.0 },
        ],
        byProperty: [
          { propertyName: 'Marina Crown Tower', totalRevenue: 21250.0, totalExpenses: 4090.5, netOperatingIncome: 17159.5 },
          { propertyName: 'Downtown Luxury Heights', totalRevenue: 0.0, totalExpenses: 1100.0, netOperatingIncome: -1100.0 },
          { propertyName: 'Corniche View Residences', totalRevenue: 0.0, totalExpenses: 4650.0, netOperatingIncome: -4650.0 },
        ],
      };
      return rep as unknown as T;
    }

    if (path === '/reports/rent-arrears') {
      const arrears: RentArrearsItem[] = [
        {
          tenantId: 't3',
          tenantName: 'Elena Rostova',
          tenantPhone: '+971 56 772 1993',
          propertyName: 'Downtown Luxury Heights',
          unitNumber: '2001',
          overdueAmount: '36250.00',
          dueDate: '2026-08-01',
          daysOverdue: 75,
        },
      ];
      return arrears as unknown as T;
    }

    // --- Notifications & Audit ---
    if (path === '/notifications') {
      return this.state.notifications as unknown as T;
    }

    if (path.startsWith('/notifications/') && path.endsWith('/read')) {
      const id = path.split('/')[2];
      const notif = this.state.notifications.find((n) => n.id === id);
      if (notif) {
        notif.isRead = true;
        this.persist();
      }
      return notif as unknown as T;
    }

    if (path === '/audit-logs') {
      return this.state.auditLogs as unknown as T;
    }

    // --- Workspace Settings ---
    if (path === '/workspaces/settings') {
      if (method === 'PATCH') {
        if (body.vatSettings) {
          this.state.workspace.vatSettings = {
            ...this.state.workspace.vatSettings,
            ...body.vatSettings,
          };
        }
        if (body.name) this.state.workspace.name = body.name;
        this.persist();
      }
      return {
        workspaceId: this.state.workspace.id,
        name: this.state.workspace.name,
        defaultCurrency: this.state.workspace.defaultCurrency,
        timeZone: this.state.workspace.timeZone,
        vatSettings: this.state.workspace.vatSettings,
      } as unknown as T;
    }

    return null as unknown as T;
  }
}

export const clientDemoStore = new DemoStore();
