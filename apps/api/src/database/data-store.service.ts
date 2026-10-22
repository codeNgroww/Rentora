import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  Company,
  User,
  CompanyUser,
  Workspace,
  WorkspaceMember,
  Property,
  Unit,
  Tenant,
  Lease,
  ExpenseCategory,
  Vendor,
  Expense,
  RentCharge,
  Payment,
  PaymentAllocation,
  NotificationItem,
  AuditLogItem,
} from '@rental-saas/contracts';

@Injectable()
export class DataStoreService implements OnModuleInit {
  private readonly storageFilePath = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    'rentora-store.json'
  );

  public companies: Company[] = [];
  public users: User[] = [];
  public companyUsers: CompanyUser[] = [];
  public workspaces: Workspace[] = [];
  public members: WorkspaceMember[] = [];
  public properties: Property[] = [];
  public units: Unit[] = [];
  public tenants: Tenant[] = [];
  public leases: Lease[] = [];
  public categories: ExpenseCategory[] = [];
  public vendors: Vendor[] = [];
  public expenses: Expense[] = [];
  public rentCharges: RentCharge[] = [];
  public payments: Payment[] = [];
  public allocations: PaymentAllocation[] = [];
  public notifications: NotificationItem[] = [];
  public auditLogs: AuditLogItem[] = [];

  onModuleInit() {
    this.loadFromStorage();
  }

  public generateUuid(): string {
    return randomUUID();
  }

  public loadFromStorage() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const data = JSON.parse(raw);
        this.companies = data.companies || data.workspaces || [];
        this.workspaces = data.workspaces || this.companies || [];
        this.users = data.users || data.companyUsers || data.members || [];
        this.companyUsers = this.users;
        this.members = this.users;
        this.properties = data.properties || [];
        this.units = data.units || [];
        this.tenants = data.tenants || [];
        this.leases = data.leases || [];
        this.categories = data.categories || [];
        this.vendors = data.vendors || [];
        this.expenses = data.expenses || [];
        this.rentCharges = data.rentCharges || [];
        this.payments = data.payments || [];
        this.allocations = data.allocations || [];
        this.notifications = data.notifications || [];
        this.auditLogs = data.auditLogs || [];

        // Ensure at least default workspace exists
        if (this.companies.length === 0 || this.workspaces.length === 0) {
          this.seedDefaultCompanyAndWorkspace();
        }

        // Ensure Super Admin exists
        const superAdminExists = this.users.some(
          (u) => u.role === 'super_admin' || u.email === 'superadmin@rentora.ae'
        );
        if (!superAdminExists) {
          this.users.unshift({
            id: '00000000-0000-0000-0000-000000000001',
            companyId: null,
            email: 'superadmin@rentora.ae',
            fullName: 'Platform Super Admin',
            role: 'super_admin',
            status: 'active',
            isDeleted: false,
            createdAt: '2026-01-01T00:00:00Z',
          });
        }

        // For any existing onboarded company, ensure admin user exists matching its POC (never dummy data)
        this.companies.forEach((company) => {
          if (!company.pocEmail) return;
          const userExists = this.users.some(
            (u) =>
              (u.companyId === company.id || (u as any).workspaceId === company.id) &&
              ((u.email && u.email.toLowerCase() === company.pocEmail.toLowerCase()) ||
                (u.userEmail && u.userEmail.toLowerCase() === company.pocEmail.toLowerCase()))
          );
          if (!userExists) {
            this.users.push({
              id: randomUUID(),
              companyId: company.id,
              workspaceId: company.id,
              userId: randomUUID(),
              email: company.pocEmail,
              userEmail: company.pocEmail,
              fullName: company.pocName || 'Company Administrator',
              userName: company.pocName || 'Company Administrator',
              phoneNumber: company.pocPhone,
              userPhone: company.pocPhone,
              role: 'admin',
              status: 'active',
              isDeleted: false,
              createdAt: company.createdAt || new Date().toISOString(),
            });
          }
        });

        // Normalize universal columns and soft-delete defaults
        const defaultCompanyId = this.companies[0]?.id || 'c1111111-1111-4111-8111-111111111111';
        this.companies.forEach((c) => {
          c.isDeleted = c.isDeleted ?? false;
        });
        this.users.forEach((u) => {
          u.isDeleted = u.isDeleted ?? false;
        });
        this.properties.forEach((p) => {
          p.companyId = p.companyId || (p as any).workspaceId || defaultCompanyId;
          p.propertyId = p.id;
          p.isDeleted = p.isDeleted ?? false;
        });
        this.units.forEach((u) => {
          u.companyId = u.companyId || (u as any).workspaceId || defaultCompanyId;
          u.isDeleted = u.isDeleted ?? false;
        });
        this.tenants.forEach((t) => {
          t.companyId = t.companyId || (t as any).workspaceId || defaultCompanyId;
          t.isDeleted = t.isDeleted ?? false;
        });
        this.leases.forEach((l) => {
          l.companyId = l.companyId || (l as any).workspaceId || defaultCompanyId;
          l.isDeleted = l.isDeleted ?? false;
        });
        this.categories.forEach((cat) => {
          cat.isDeleted = cat.isDeleted ?? false;
        });
        this.vendors.forEach((v) => {
          v.isDeleted = v.isDeleted ?? false;
        });
        this.expenses.forEach((e) => {
          e.companyId = e.companyId || (e as any).workspaceId || defaultCompanyId;
          e.isDeleted = e.isDeleted ?? false;
        });
        this.rentCharges.forEach((r) => {
          r.companyId = r.companyId || (r as any).workspaceId || defaultCompanyId;
          r.isDeleted = r.isDeleted ?? false;
        });
        this.payments.forEach((p) => {
          p.companyId = p.companyId || (p as any).workspaceId || defaultCompanyId;
          p.isDeleted = p.isDeleted ?? false;
        });

        return;
      }
    } catch (err) {
      console.warn(`[Rentora DataStore] Could not load from ${this.storageFilePath}, initializing fresh store:`, err);
    }

    this.seedInitialData();
    this.saveToFile();
  }

  public saveToFile() {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        companies: this.companies,
        users: this.users,
        companyUsers: this.users,
        workspaces: this.workspaces,
        members: this.users,
        properties: this.properties,
        units: this.units,
        tenants: this.tenants,
        leases: this.leases,
        categories: this.categories,
        vendors: this.vendors,
        expenses: this.expenses,
        rentCharges: this.rentCharges,
        payments: this.payments,
        allocations: this.allocations,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[Rentora DataStore] Failed to save JSON file at ${this.storageFilePath}:`, err);
    }
  }

  private seedDefaultCompanyAndWorkspace() {
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.DATA_DIR && process.env.DATA_DIR.includes('test'));

    // In normal runtime, never inject dummy companies or dummy users
    if (!isTestEnv) {
      const superAdminExists = this.users.some(
        (u) => u.role === 'super_admin' || u.email === 'superadmin@rentora.ae'
      );
      if (!superAdminExists) {
        this.users.unshift({
          id: '00000000-0000-0000-0000-000000000001',
          companyId: null,
          email: 'superadmin@rentora.ae',
          fullName: 'Platform Super Admin',
          role: 'super_admin',
          status: 'active',
          isDeleted: false,
          createdAt: '2026-01-01T00:00:00Z',
        });
        this.companyUsers = this.users;
        this.members = this.users;
      }
      return;
    }

    // In isolated test environments only
    const defaultWsId = 'c1111111-1111-4111-8111-111111111111';
    const defaultCompany: Company = {
      id: defaultWsId,
      name: 'Test Property Management',
      slug: 'test-pm',
      tradeLicenseNo: 'TL-2026-0001',
      trn: '100456789000003',
      pocName: 'Test Admin',
      pocEmail: 'admin@rentora.ae',
      pocPhone: '+971 50 123 4567',
      address: 'Downtown Dubai, UAE',
      emirate: 'Dubai',
      currency: 'AED',
      timeZone: 'Asia/Dubai',
      status: 'active',
      createdBy: '00000000-0000-0000-0000-000000000000',
      updatedBy: '00000000-0000-0000-0000-000000000000',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-10-14T00:00:00Z',
    };

    const defaultWs: Workspace = {
      ...defaultCompany,
      ownerId: 'a1111111-1111-4111-8111-111111111111',
      defaultCurrency: 'AED',
      vatSettings: {
        enabled: true,
        defaultRate: 5.0,
        trn: '100456789000003',
        calculationMode: 'exclusive',
      },
    };

    if (this.companies.length === 0) {
      this.companies.push(defaultCompany);
    }
    if (this.workspaces.length === 0) {
      this.workspaces.push(defaultWs);
    }
    if (this.users.length === 0) {
      this.users.push(
        {
          id: '00000000-0000-0000-0000-000000000001',
          companyId: null,
          email: 'superadmin@rentora.ae',
          fullName: 'Platform Super Admin',
          role: 'super_admin',
          status: 'active',
          isDeleted: false,
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'a1111111-1111-4111-8111-111111111111',
          companyId: defaultWsId,
          workspaceId: defaultWsId,
          userId: 'a1111111-1111-4111-8111-111111111111',
          email: 'admin@rentora.ae',
          userEmail: 'admin@rentora.ae',
          fullName: 'Test Admin',
          userName: 'Test Admin',
          role: 'admin',
          status: 'active',
          isDeleted: false,
          createdAt: '2026-01-01T00:00:00Z',
        }
      );
      this.companyUsers = this.users;
      this.members = this.users;
    }
  }

  private seedInitialData() {
    this.seedDefaultCompanyAndWorkspace();

    // Standard system expense categories
    if (this.categories.length === 0) {
      this.categories = [
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
    }

    // When running unit/integration tests or in isolated test directories, populate test fixtures
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.DATA_DIR && process.env.DATA_DIR.includes('test'));

    if (isTestEnv && this.properties.length === 0) {
      const wsId = this.companies[0]?.id || 'c1111111-1111-4111-8111-111111111111';

      this.properties.push({
        id: 'p1',
        companyId: wsId,
        workspaceId: wsId,
        name: 'Downtown Luxury Heights',
        type: 'residential',
        address: 'Downtown Dubai, UAE',
        emirate: 'Dubai',
        totalUnits: 1,
        isArchived: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      this.units.push({
        id: 'u101',
        companyId: wsId,
        workspaceId: wsId,
        propertyId: 'p1',
        unitNumber: '101',
        floor: '1',
        type: 'residential',
        bedrooms: 2,
        bathrooms: 2,
        marketRent: '85000.00',
        status: 'occupied',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      this.tenants.push(
        {
          id: 't1',
          companyId: wsId,
          workspaceId: wsId,
          fullName: 'Rashid Al-Falasi',
          email: 'rashid.alfalasi@example.ae',
          phoneNumber: '+971 50 111 2233',
          preferredContact: 'phone',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 't2',
          companyId: wsId,
          workspaceId: wsId,
          fullName: 'Sarah Jenkins',
          email: 'sarah.jenkins@example.com',
          phoneNumber: '+971 52 333 4455',
          preferredContact: 'email',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }
      );

      this.leases.push({
        id: 'l1',
        companyId: wsId,
        workspaceId: wsId,
        unitId: 'u101',
        propertyId: 'p1',
        tenantId: 't1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        annualRent: '85000.00',
        paymentFrequency: 'quarterly',
        numberOfCheques: 4,
        securityDeposit: '4250.00',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      this.rentCharges.push({
        id: 'rc3',
        companyId: wsId,
        workspaceId: wsId,
        leaseId: 'l1',
        propertyId: 'p1',
        unitId: 'u101',
        tenantId: 't1',
        periodStart: '2026-08-01',
        periodEnd: '2026-10-31',
        dueDate: '2026-08-01',
        amount: '36250.00',
        paidAmount: '0.00',
        outstandingAmount: '36250.00',
        status: 'overdue',
        notes: 'Quarterly rent PDC - overdue',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      });
    }
  }
}
