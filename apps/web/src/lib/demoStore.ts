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
import { isDateInRange } from './dateFilters';

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

const STORAGE_KEY = 'rentora_store_live_v2';

class DemoStore {
  private state: DemoStoreState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DemoStoreState {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('rentora_demo_store_v1');
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
      const from = params.get('from');
      const to = params.get('to');
      const period = params.get('period') || '2026-10';

      const activeExpenses = this.state.expenses.filter((e) => {
        if (e.status === 'voided') return false;
        if (from && to) return isDateInRange(e.expenseDate, from, to);
        return e.expenseDate.startsWith(period);
      });

      const expensesPaid = activeExpenses
        .filter((e) => e.status === 'paid')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const periodPayments = this.state.payments.filter((p) => {
        if (from && to) return isDateInRange(p.paymentDate, from, to);
        return p.paymentDate.startsWith(period);
      });

      const rentCollected = periodPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );

      const periodCharges = this.state.rentCharges.filter((c) => {
        if (c.status === 'voided') return false;
        if (from && to) return isDateInRange(c.dueDate, from, to);
        return c.dueDate.startsWith(period);
      });

      const arrearsTotal = periodCharges
        .filter((c) => c.status === 'overdue' || c.status === 'partially_paid')
        .reduce((sum, c) => sum + parseFloat(c.outstandingAmount || c.amount), 0);

      const occupiedUnits = this.state.units.filter((u) => u.status === 'occupied').length;

      const summary: DashboardSummary = {
        workspaceId: this.state.workspace.id,
        period,
        currency: 'AED',
        propertyCount: this.state.properties.length,
        totalUnits: this.state.units.length,
        occupiedUnits,
        vacantUnits: this.state.units.length - occupiedUnits,
        occupancyRate: this.state.units.length > 0 ? (occupiedUnits / this.state.units.length) * 100 : 85.3,
        rentDue: (rentCollected + arrearsTotal).toFixed(2),
        rentCollected: rentCollected.toFixed(2),
        rentOutstanding: arrearsTotal.toFixed(2),
        expensesPaid: expensesPaid.toFixed(2),
        pendingExpenses: '420.00',
        netCashFlow: (rentCollected - expensesPaid).toFixed(2),
        categoryBreakdown: INITIAL_DASHBOARD_SUMMARY.categoryBreakdown,
        recentActivity: INITIAL_DASHBOARD_SUMMARY.recentActivity,
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
      const enriched = this.state.properties.map((p) => {
        const pUnits = this.state.units.filter((u) => u.propertyId === p.id);
        const occupied = pUnits.filter((u) => u.status === 'occupied').length;
        return {
          ...p,
          totalUnits: pUnits.length,
          occupiedUnits: occupied,
          vacantUnits: pUnits.length - occupied,
        };
      });
      return enriched as unknown as T;
    }

    if (path.startsWith('/properties/') && !path.includes('/units')) {
      const id = path.replace('/properties/', '');
      if (method === 'PATCH') {
        const prop = this.state.properties.find((p) => p.id === id);
        if (prop) {
          Object.assign(prop, body, { updatedAt: new Date().toISOString() });
          this.persist();
        }
        return prop as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.properties.findIndex((p) => p.id === id);
        if (idx !== -1) {
          const deleted = this.state.properties.splice(idx, 1)[0];
          this.state.units = this.state.units.filter((u) => u.propertyId !== id);
          this.persist();
          return deleted as unknown as T;
        }
      }
      const prop = this.state.properties.find((p) => p.id === id);
      const propUnits = this.state.units.filter((u) => u.propertyId === id);
      return { ...prop, units: propUnits } as unknown as T;
    }

    // --- Units ---
    if (path.startsWith('/units/')) {
      const id = path.replace('/units/', '');
      if (method === 'PATCH') {
        const unit = this.state.units.find((u) => u.id === id);
        if (unit) {
          Object.assign(unit, body, { updatedAt: new Date().toISOString() });
          this.persist();
        }
        return unit as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.units.findIndex((u) => u.id === id);
        if (idx !== -1) {
          const deleted = this.state.units.splice(idx, 1)[0];
          this.persist();
          return deleted as unknown as T;
        }
      }
      const unit = this.state.units.find((u) => u.id === id);
      return unit as unknown as T;
    }

    if (path === '/units') {
      const propId = params.get('propertyId');
      if (propId) {
        return this.state.units.filter((u) => u.propertyId === propId) as unknown as T;
      }
      return this.state.units as unknown as T;
    }

    if (path.includes('/properties/') && path.endsWith('/units') && method === 'POST') {
      const propId = path.split('/')[2];
      const isCommercial = body.type === 'commercial' || body.isShop === true;
      const isParking = body.type === 'parking';
      const newUnit: Unit = {
        id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workspaceId: this.state.workspace.id,
        propertyId: propId,
        unitNumber: body.unitNumber || '101',
        type: body.type || (body.isShop ? 'commercial' : 'residential'),
        isShop: isCommercial,
        floor: body.floor || '1st Floor',
        bedrooms: isCommercial || isParking ? 0 : (body.bedrooms ?? 1),
        bathrooms: isCommercial || isParking ? 0 : (body.bathrooms ?? 1),
        squareFeet: body.squareFeet || (isParking ? 150 : isCommercial ? 600 : 800),
        marketRent: body.marketRent || (isParking ? '500.00' : '5000.00'),
        status: body.status || 'vacant',
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
    if (path.startsWith('/tenants/')) {
      const id = path.replace('/tenants/', '');
      if (method === 'PATCH') {
        const tenant = this.state.tenants.find((t) => t.id === id);
        if (tenant) {
          Object.assign(tenant, body);
          this.persist();
        }
        return tenant as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.tenants.findIndex((t) => t.id === id);
        if (idx !== -1) {
          const deleted = this.state.tenants.splice(idx, 1)[0];
          this.persist();
          return deleted as unknown as T;
        }
      }
      return this.state.tenants.find((t) => t.id === id) as unknown as T;
    }

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
    if (path.startsWith('/leases/')) {
      const id = path.replace('/leases/', '');
      if (method === 'PATCH') {
        const lease = this.state.leases.find((l) => l.id === id);
        if (lease) {
          Object.assign(lease, body, { updatedAt: new Date().toISOString() });
          this.persist();
        }
        return lease as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.leases.findIndex((l) => l.id === id);
        if (idx !== -1) {
          const deleted = this.state.leases.splice(idx, 1)[0];
          const targetUnitIds =
            deleted.unitIds && deleted.unitIds.length > 0 ? deleted.unitIds : [deleted.unitId];
          this.state.units.forEach((unit) => {
            if (targetUnitIds.includes(unit.id)) {
              unit.status = 'vacant';
              unit.currentLeaseId = undefined;
              unit.currentTenantName = undefined;
            }
          });
          this.state.rentCharges = this.state.rentCharges.filter((c) => c.leaseId !== deleted.id);
          this.persist();
          return deleted as unknown as T;
        }
      }
      return this.state.leases.find((l) => l.id === id) as unknown as T;
    }

    if (path === '/leases') {
      if (method === 'POST') {
        const targetUnitIds =
          body.unitIds && body.unitIds.length > 0 ? body.unitIds : [body.unitId];
        const numCheques = Number(body.numberOfCheques || (body.cheques ? body.cheques.length : 4));
        const rentAmt = parseFloat(body.annualRent || '60000.00');
        const installmentAmt = (rentAmt / numCheques).toFixed(2);
        const [startYear, startMonth, startDay] = (body.startDate || '2026-10-01').split('-').map(Number);
        const monthsPerInstallment = Math.round(12 / numCheques);
        const leaseId = `l-${Date.now()}`;

        // Ensure cheques array exists with proforma invoice numbers
        const finalCheques = (body.cheques && Array.isArray(body.cheques) && body.cheques.length > 0)
          ? body.cheques.map((c: any, i: number) => ({
              ...c,
              proformaInvoiceNumber: c.proformaInvoiceNumber || `PI-${startYear}-${leaseId.slice(-4)}-${String(i + 1).padStart(2, '0')}`,
            }))
          : Array.from({ length: numCheques }).map((_, i) => {
              const d = new Date(startYear, startMonth - 1 + i * monthsPerInstallment, startDay);
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return {
                chequeNumber: `CHQ-${1001 + i}`,
                dueDate: iso,
                amount: installmentAmt,
                bankName: 'Emirates NBD',
                notes: `Installment ${i + 1} of ${numCheques}`,
                proformaInvoiceNumber: `PI-${startYear}-${leaseId.slice(-4)}-${String(i + 1).padStart(2, '0')}`,
              };
            });

        const newLease: Lease = {
          id: leaseId,
          workspaceId: this.state.workspace.id,
          unitId: targetUnitIds[0],
          unitIds: targetUnitIds,
          propertyId: body.propertyId,
          tenantId: body.tenantId,
          startDate: body.startDate || '2026-10-01',
          endDate: body.endDate || '2027-09-30',
          annualRent: body.annualRent || '60000.00',
          paymentFrequency: body.paymentFrequency || 'quarterly',
          numberOfCheques: numCheques,
          securityDeposit: body.securityDeposit || '3000.00',
          status: 'active',
          termsNotes: body.termsNotes || '',
          cheques: finalCheques,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.leases.push(newLease);
        // Mark all target units as occupied
        const tenant = this.state.tenants.find((t) => t.id === body.tenantId);
        this.state.units.forEach((u) => {
          if (targetUnitIds.includes(u.id)) {
            u.status = 'occupied';
            u.currentLeaseId = newLease.id;
            u.currentTenantName = tenant?.fullName || 'Tenant';
          }
        });

        // Generate Rent Charges corresponding to each proforma invoice installment
        finalCheques.forEach((chq: any, i: number) => {
          const charge: RentCharge = {
            id: `rc-${Date.now()}-${i + 1}`,
            workspaceId: this.state.workspace.id,
            leaseId: newLease.id,
            propertyId: newLease.propertyId,
            unitId: newLease.unitId,
            tenantId: newLease.tenantId,
            periodStart: chq.dueDate || newLease.startDate,
            periodEnd: newLease.endDate,
            dueDate: chq.dueDate || newLease.startDate,
            amount: parseFloat(chq.amount || '0').toFixed(2),
            paidAmount: '0.00',
            outstandingAmount: parseFloat(chq.amount || '0').toFixed(2),
            status: 'pending',
            invoiceNumber: chq.proformaInvoiceNumber,
            installmentIndex: i + 1,
            installmentTotal: finalCheques.length,
            notes:
              chq.notes ||
              `Cheque ${i + 1} of ${finalCheques.length} ${chq.bankName ? `(${chq.bankName})` : ''} ${chq.chequeNumber ? `CHQ #${chq.chequeNumber}` : ''}`.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.state.rentCharges.push(charge);
        });
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
      const from = params.get('from');
      const to = params.get('to');
      if (from || to) {
        list = list.filter((e) => isDateInRange(e.expenseDate, from, to));
      }
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

    if (path.startsWith('/expenses/')) {
      const id = path.replace('/expenses/', '');
      if (method === 'PATCH') {
        const expense = this.state.expenses.find((e) => e.id === id);
        if (expense) {
          Object.assign(expense, body, { updatedAt: new Date().toISOString() });
          this.persist();
        }
        return expense as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.expenses.findIndex((e) => e.id === id);
        if (idx !== -1) {
          const deleted = this.state.expenses.splice(idx, 1)[0];
          this.persist();
          return deleted as unknown as T;
        }
      }
      return this.state.expenses.find((e) => e.id === id) as unknown as T;
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
      let charges = [...this.state.rentCharges];
      const status = params.get('status');
      const from = params.get('from');
      const to = params.get('to');
      const propertyId = params.get('propertyId');
      const tenantId = params.get('tenantId');

      if (status) charges = charges.filter((c) => c.status === status);
      if (propertyId) charges = charges.filter((c) => c.propertyId === propertyId);
      if (tenantId) charges = charges.filter((c) => c.tenantId === tenantId);
      if (from || to) charges = charges.filter((c) => isDateInRange(c.dueDate, from, to));

      return charges.map((c) => {
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

    if (path.startsWith('/rent-charges/')) {
      const id = path.replace('/rent-charges/', '');
      if (method === 'PATCH') {
        const charge = this.state.rentCharges.find((c) => c.id === id);
        if (charge) {
          Object.assign(charge, body, { updatedAt: new Date().toISOString() });
          this.persist();
        }
        return charge as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.rentCharges.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const deleted = this.state.rentCharges.splice(idx, 1)[0];
          this.persist();
          return deleted as unknown as T;
        }
      }
      return this.state.rentCharges.find((c) => c.id === id) as unknown as T;
    }

    if (path.startsWith('/payments/')) {
      const id = path.replace('/payments/', '');
      if (method === 'PATCH') {
        const payment = this.state.payments.find((p) => p.id === id);
        if (payment) {
          Object.assign(payment, body);
          this.persist();
        }
        return payment as unknown as T;
      }
      if (method === 'DELETE') {
        const idx = this.state.payments.findIndex((p) => p.id === id);
        if (idx !== -1) {
          const deleted = this.state.payments.splice(idx, 1)[0];
          this.persist();
          return deleted as unknown as T;
        }
      }
      return this.state.payments.find((p) => p.id === id) as unknown as T;
    }

    if (path === '/payments') {
      if (method === 'POST') {
        const amt = parseFloat(body.amount);
        const invoiceNumber = body.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
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
          proofUrl: body.proofUrl || undefined,
          proofName: body.proofName || undefined,
          invoiceNumber,
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
      let payments = [...this.state.payments];
      const from = params.get('from');
      const to = params.get('to');
      const propertyId = params.get('propertyId');
      const tenantId = params.get('tenantId');

      if (propertyId) payments = payments.filter((p) => p.propertyId === propertyId);
      if (tenantId) payments = payments.filter((p) => p.tenantId === tenantId);
      if (from || to) payments = payments.filter((p) => isDateInRange(p.paymentDate, from, to));

      return payments.map((p) => {
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
      const from = params.get('from');
      const to = params.get('to');

      const propertiesSummary = this.state.properties.map((p) => {
        const propUnits = this.state.units.filter((u) => u.propertyId === p.id);
        const occupied = propUnits.filter((u) => u.status === 'occupied').length;

        // Income from payments for this property in range
        const propPayments = this.state.payments.filter((pay) => {
          if (pay.propertyId !== p.id) return false;
          if (from || to) return isDateInRange(pay.paymentDate, from, to);
          return pay.paymentDate.startsWith('2026-10');
        });
        const incomeNum = propPayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);

        // Operating expenses for this property in range
        const propExpenses = this.state.expenses.filter((exp) => {
          if (exp.propertyId !== p.id || exp.status === 'voided') return false;
          if (from || to) return isDateInRange(exp.expenseDate, from, to);
          return exp.expenseDate.startsWith('2026-10');
        });
        const expensesNum = propExpenses
          .filter((exp) => exp.status === 'paid')
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        const netNum = incomeNum - expensesNum;

        return {
          propertyId: p.id,
          propertyName: p.name,
          income: incomeNum.toFixed(2),
          expenses: expensesNum.toFixed(2),
          net: netNum.toFixed(2),
          occupiedUnits: occupied,
          totalUnits: propUnits.length,
        };
      });

      const totalIncomeNum = propertiesSummary.reduce((sum, p) => sum + parseFloat(p.income), 0);
      const totalExpensesNum = propertiesSummary.reduce((sum, p) => sum + parseFloat(p.expenses), 0);
      const netCashFlowNum = totalIncomeNum - totalExpensesNum;

      const arrearsTotalNum = this.state.rentCharges
        .filter((c) => c.status === 'overdue' || (c.status === 'partially_paid' && parseFloat(c.outstandingAmount || '0') > 0))
        .reduce((sum, c) => sum + parseFloat(c.outstandingAmount || '0'), 0);

      const rep: FinancialReportSummary = {
        periodLabel: from && to ? `${from} to ${to}` : 'October 2026',
        currency: 'AED',
        totalIncome: totalIncomeNum.toFixed(2),
        totalExpenses: totalExpensesNum.toFixed(2),
        netCashFlow: netCashFlowNum.toFixed(2),
        rentArrearsTotal: arrearsTotalNum.toFixed(2),
        propertiesSummary,
      };
      return rep as unknown as T;
    }

    if (path === '/reports/rent-arrears') {
      const arrears: RentArrearsItem[] = this.state.rentCharges
        .filter((c) => c.status === 'overdue' || (c.status === 'partially_paid' && parseFloat(c.outstandingAmount || '0') > 0))
        .map((c) => {
          const prop = this.state.properties.find((p) => p.id === c.propertyId);
          const tenant = this.state.tenants.find((t) => t.id === c.tenantId);
          const unit = this.state.units.find((u) => u.id === c.unitId);
          return {
            rentChargeId: c.id,
            propertyId: c.propertyId,
            propertyName: prop?.name || 'Property',
            unitNumber: unit?.unitNumber || '',
            tenantName: tenant?.fullName || 'Tenant',
            tenantPhone: tenant?.phoneNumber || '',
            dueDate: c.dueDate,
            amountDue: c.amount,
            amountPaid: c.paidAmount,
            outstandingBalance: c.outstandingAmount,
            daysOverdue: 0,
          };
        });
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
