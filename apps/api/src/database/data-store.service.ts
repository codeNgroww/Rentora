import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
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

  public loadFromStorage() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const data = JSON.parse(raw);
        this.workspaces = data.workspaces || [];
        this.members = data.members || [];
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
        console.log(`[Rentora DataStore] Loaded persisted records from ${this.storageFilePath}`);
        return;
      }
    } catch (err) {
      console.warn(`[Rentora DataStore] Could not load from ${this.storageFilePath}, initializing fresh seed:`, err);
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
        workspaces: this.workspaces,
        members: this.members,
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

  private seedInitialData() {
    const wsId = 'w1111111-1111-4111-8111-111111111111';

    // Workspaces
    this.workspaces.push({
      id: wsId,
      name: 'Al Reem Properties LLC',
      slug: 'al-reem-properties',
      defaultCurrency: 'AED',
      timeZone: 'Asia/Dubai',
      ownerId: 'a1111111-1111-4111-8111-111111111111',
      vatSettings: {
        enabled: true,
        defaultRate: 5.0,
        trn: '100293849500003',
        calculationMode: 'exclusive',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-10-14T10:00:00Z',
    });

    // Workspace Members
    this.members.push(
      {
        id: 'm1',
        workspaceId: wsId,
        userId: 'a1111111-1111-4111-8111-111111111111',
        userEmail: 'sultan@alreem.ae',
        userName: 'Sultan Al Nuaimi',
        role: 'owner',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'm2',
        workspaceId: wsId,
        userId: 'a2222222-2222-4222-8222-222222222222',
        userEmail: 'rami@alreem.ae',
        userName: 'Rami Khoury',
        role: 'manager',
        status: 'active',
        createdAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'm3',
        workspaceId: wsId,
        userId: 'a3333333-3333-4333-8333-333333333333',
        userEmail: 'fatima@alreem.ae',
        userName: 'Fatima Zahra',
        role: 'accountant',
        status: 'active',
        createdAt: '2026-02-15T00:00:00Z',
      }
    );

    // Expense Categories
    this.categories.push(
      {
        id: 'c1',
        workspaceId: wsId,
        name: 'Maintenance & Repairs',
        color: '#10b981',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c2',
        workspaceId: wsId,
        name: 'Utilities (DEWA/ADDC)',
        color: '#0284c7',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c3',
        workspaceId: wsId,
        name: 'Cleaning & Sanitation',
        color: '#8b5cf6',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c4',
        workspaceId: wsId,
        name: 'Management Fees',
        color: '#f59e0b',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c5',
        workspaceId: wsId,
        name: 'Building Insurance',
        color: '#ef4444',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c6',
        workspaceId: wsId,
        name: 'Service Charges',
        color: '#06b6d4',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c7',
        workspaceId: wsId,
        name: 'Supplies & Tools',
        color: '#64748b',
        isSystemDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      }
    );

    // Vendors
    this.vendors.push(
      {
        id: 'v1',
        workspaceId: wsId,
        name: 'Gulf Cooling & HVAC Services',
        contactPerson: 'Rashid Al Baloushi',
        email: 'service@gulfcooling.ae',
        phone: '+971 4 399 1234',
        serviceCategory: 'HVAC / AC Maintenance',
        trnOrTaxId: '100293849500003',
        createdAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'v2',
        workspaceId: wsId,
        name: 'Emirates Sparkle Cleaning Co',
        contactPerson: 'Nadeem Akhtar',
        email: 'contact@sparkledubai.com',
        phone: '+971 4 355 9876',
        serviceCategory: 'Cleaning',
        trnOrTaxId: '100483920100003',
        createdAt: '2026-02-10T00:00:00Z',
      },
      {
        id: 'v3',
        workspaceId: wsId,
        name: 'Dubai Electricity & Water Authority (DEWA)',
        contactPerson: 'Customer Support',
        email: 'customercare@dewa.gov.ae',
        phone: '800 9090',
        serviceCategory: 'Government Utilities',
        createdAt: '2026-01-01T00:00:00Z',
      }
    );

    // Properties
    const prop1Id = 'p1';
    const prop2Id = 'p2';
    const prop3Id = 'p3';

    this.properties.push(
      {
        id: prop1Id,
        workspaceId: wsId,
        name: 'Marina Crown Tower',
        type: 'apartment_building',
        address: 'Al Marsa Street, Dubai Marina',
        emirate: 'Dubai',
        communityArea: 'Dubai Marina',
        buildingReference: 'BLDG-MCT-01',
        totalUnits: 31,
        notes: 'Premium high-rise tower overlooking the Marina promenade',
        isArchived: false,
        createdAt: '2026-01-05T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: prop2Id,
        workspaceId: wsId,
        name: 'Downtown Luxury Heights',
        type: 'residential',
        address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
        emirate: 'Dubai',
        communityArea: 'Downtown Dubai',
        buildingReference: 'BLDG-DLH-02',
        totalUnits: 2,
        notes: 'Luxury residences next to Dubai Mall and Burj Khalifa',
        isArchived: false,
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: prop3Id,
        workspaceId: wsId,
        name: 'Corniche View Residences',
        type: 'residential',
        address: 'Corniche Road West, Al Bateen',
        emirate: 'Abu Dhabi',
        communityArea: 'Corniche',
        buildingReference: 'BLDG-CVR-03',
        totalUnits: 1,
        notes: 'Waterfront luxury apartments in capital',
        isArchived: false,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      }
    );

    // Units
    const u101 = 'u101';
    const u102 = 'u102';
    const u103 = 'u103';
    const u201 = 'u201';
    const u202 = 'u202';
    const u301 = 'u301';

    // Building View Units for Marina Crown Tower (30 Rooms + 1 Shop)
    const buildingRooms = [
      // Floor 5
      { unit: '501', floor: '5th Floor', tenant: 'Nisha', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '502', floor: '5th Floor', tenant: undefined, status: 'vacant' as const, pay: 'vacant' as const, rent: '10000.00' },
      { unit: '503', floor: '5th Floor', tenant: 'Asha', status: 'occupied' as const, pay: 'partially_paid' as const, rent: '10000.00', due: '9000.00', prevDues: 1 },
      { unit: '504', floor: '5th Floor', tenant: 'Shreya', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00' },
      { unit: '505', floor: '5th Floor', tenant: 'Naveen', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '506', floor: '5th Floor', tenant: 'Bindu', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },

      // Floor 4
      { unit: '401', floor: '4th Floor', tenant: 'Fathima', status: 'occupied' as const, pay: 'overdue' as const, rent: '13000.00', due: '13000.00', prevDues: 1 },
      { unit: '402', floor: '4th Floor', tenant: 'Swathi', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '403', floor: '4th Floor', tenant: 'Imran', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '404', floor: '4th Floor', tenant: 'Anand', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '405', floor: '4th Floor', tenant: 'Reshma', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '406', floor: '4th Floor', tenant: undefined, status: 'vacant' as const, pay: 'vacant' as const, rent: '10000.00' },

      // Floor 3
      { unit: '301', floor: '3rd Floor', tenant: 'Kavya', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00' },
      { unit: '302', floor: '3rd Floor', tenant: 'Faisal', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '303', floor: '3rd Floor', tenant: 'Ajay', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '304', floor: '3rd Floor', tenant: 'Pooja', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '305', floor: '3rd Floor', tenant: undefined, status: 'vacant' as const, pay: 'vacant' as const, rent: '10000.00', prevDues: 1 },
      { unit: '306', floor: '3rd Floor', tenant: 'Sanjay', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00' },

      // Floor 2
      { unit: '201', floor: '2nd Floor', tenant: 'Rohit', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '202', floor: '2nd Floor', tenant: 'Suresh', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00' },
      { unit: '203', floor: '2nd Floor', tenant: 'Lakshmi', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00' },
      { unit: '204', floor: '2nd Floor', tenant: 'Nikhil', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '205', floor: '2nd Floor', tenant: 'Aisha', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00' },
      { unit: '206', floor: '2nd Floor', tenant: undefined, status: 'vacant' as const, pay: 'vacant' as const, rent: '10000.00' },

      // Floor 1
      { unit: '101', floor: '1st Floor', tenant: 'Priya', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '102', floor: '1st Floor', tenant: 'Anjali', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '103', floor: '1st Floor', tenant: 'Vikram', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '104', floor: '1st Floor', tenant: 'Sneha', status: 'occupied' as const, pay: 'overdue' as const, rent: '36000.00', due: '36000.00', prevDues: 3 },
      { unit: '105', floor: '1st Floor', tenant: 'Karthik', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },
      { unit: '106', floor: '1st Floor', tenant: 'Meera', status: 'occupied' as const, pay: 'paid' as const, rent: '10000.00', paid: '10000.00' },

      // Ground Floor
      { unit: 'SHOP-1', floor: 'Ground Floor', tenant: 'Fresh Supermarket', status: 'occupied' as const, pay: 'overdue' as const, rent: '10000.00', due: '10000.00', isShop: true },
    ];

    for (const r of buildingRooms) {
      const uId = r.unit === '101' ? u101 : r.unit === '102' ? u102 : r.unit === '103' ? u103 : `u-${r.unit.toLowerCase()}`;
      this.units.push({
        id: uId,
        workspaceId: wsId,
        propertyId: prop1Id,
        unitNumber: r.unit,
        floor: r.floor,
        bedrooms: r.isShop ? 0 : 2,
        bathrooms: r.isShop ? 1 : 2,
        squareFeet: r.isShop ? 1800 : 950,
        marketRent: r.rent,
        status: r.status,
        currentTenantName: r.tenant,
        paymentStatus: r.pay,
        paidAmount: r.paid || '0.00',
        dueAmount: r.due || (r.pay === 'overdue' ? r.rent : '0.00'),
        previousDuesMonths: r.prevDues,
        isShop: r.isShop,
        createdAt: '2026-01-05T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      });
    }

    // Additional units for other properties
    this.units.push(
      {
        id: u201,
        workspaceId: wsId,
        propertyId: prop2Id,
        unitNumber: '2001',
        floor: '20th Floor',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        marketRent: '145000.00',
        status: 'occupied',
        currentTenantName: 'Elena Rostova',
        paymentStatus: 'overdue',
        dueAmount: '36250.00',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: u202,
        workspaceId: wsId,
        propertyId: prop2Id,
        unitNumber: '2002',
        floor: '20th Floor',
        bedrooms: 3,
        bathrooms: 4,
        squareFeet: 2100,
        marketRent: '220000.00',
        status: 'vacant',
        paymentStatus: 'vacant',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: u301,
        workspaceId: wsId,
        propertyId: prop3Id,
        unitNumber: '502',
        floor: '5th Floor',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1400,
        marketRent: '115000.00',
        status: 'occupied',
        currentTenantName: 'Khalid Al Hashimi',
        paymentStatus: 'paid',
        paidAmount: '115000.00',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      }
    );

    // Tenants
    const t1 = 't1';
    const t2 = 't2';
    const t3 = 't3';
    const t4 = 't4';

    this.tenants.push(
      {
        id: t1,
        workspaceId: wsId,
        fullName: 'Alexander Wright',
        email: 'alex.wright@example.com',
        phoneNumber: '+971 50 443 2190',
        emiratesId: '784-1988-1234567-1',
        passportNumber: 'GB9823410',
        preferredContact: 'email',
        notes: 'Corporate client in tech consulting',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: t2,
        workspaceId: wsId,
        fullName: 'Tariq Mansoor',
        email: 'tariq.m@example.com',
        phoneNumber: '+971 52 331 8844',
        emiratesId: '784-1992-7654321-2',
        preferredContact: 'whatsapp',
        notes: 'Prefers quarterly payment via bank transfer',
        createdAt: '2026-02-15T00:00:00Z',
      },
      {
        id: t3,
        workspaceId: wsId,
        fullName: 'Elena Rostova',
        email: 'elena.rostova@example.com',
        phoneNumber: '+971 56 772 1993',
        emiratesId: '784-1985-5544332-1',
        preferredContact: 'phone',
        notes: 'Renewed lease for year 2',
        createdAt: '2025-10-20T00:00:00Z',
      },
      {
        id: t4,
        workspaceId: wsId,
        fullName: 'Khalid Al Hashimi',
        email: 'khalid.hashimi@example.com',
        phoneNumber: '+971 50 998 1234',
        emiratesId: '784-1980-9988776-3',
        preferredContact: 'email',
        notes: 'Government employee',
        createdAt: '2026-02-01T00:00:00Z',
      }
    );

    // Leases
    const l1 = 'l1';
    const l2 = 'l2';
    const l3 = 'l3';
    const l4 = 'l4';

    this.leases.push(
      {
        id: l1,
        workspaceId: wsId,
        unitId: u101,
        propertyId: prop1Id,
        tenantId: t1,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        annualRent: '85000.00',
        paymentFrequency: 'quarterly',
        numberOfCheques: 4,
        securityDeposit: '4250.00',
        status: 'active',
        termsNotes: '4 cheques payable to Al Reem Properties LLC',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: l2,
        workspaceId: wsId,
        unitId: u102,
        propertyId: prop1Id,
        tenantId: t2,
        startDate: '2026-03-01',
        endDate: '2027-02-28',
        annualRent: '130000.00',
        paymentFrequency: 'quarterly',
        numberOfCheques: 4,
        securityDeposit: '6500.00',
        status: 'active',
        termsNotes: 'Includes covered parking bay P1-14',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: l3,
        workspaceId: wsId,
        unitId: u201,
        propertyId: prop2Id,
        tenantId: t3,
        startDate: '2025-11-01',
        endDate: '2026-10-31',
        annualRent: '145000.00',
        paymentFrequency: 'quarterly',
        numberOfCheques: 4,
        securityDeposit: '7250.00',
        status: 'expiring',
        termsNotes: '4 quarterly bank cheques. Renewal notice sent on 1 August 2026 per UAE 90-day law',
        createdAt: '2025-11-01T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
      {
        id: l4,
        workspaceId: wsId,
        unitId: u301,
        propertyId: prop3Id,
        tenantId: t4,
        startDate: '2026-02-01',
        endDate: '2027-01-31',
        annualRent: '115000.00',
        paymentFrequency: 'semi-annual',
        numberOfCheques: 2,
        securityDeposit: '5750.00',
        status: 'active',
        termsNotes: 'Abu Dhabi Tawtheeq registered contract',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      }
    );

    // Expenses (with sample entries matching reference UI)
    this.expenses.push(
      {
        id: 'e1',
        workspaceId: wsId,
        propertyId: prop1Id,
        unitId: u101,
        categoryId: 'c1',
        vendorId: 'v1',
        description: 'AC compressor valve replacement & coil cleanup',
        amount: '850.00',
        currency: 'AED',
        expenseDate: '2026-10-04',
        status: 'paid',
        paymentMethod: 'bank_transfer',
        paidAt: '2026-10-04T11:20:00Z',
        reference: 'INV-GC-8902',
        notes: 'Resolved cooling issue for master bedroom',
        attachments: [
          {
            id: 'att1',
            expenseId: 'e1',
            fileName: 'invoice_gc_8902.pdf',
            fileSize: 245000,
            fileType: 'application/pdf',
            storagePath: 'receipts/e1/invoice_gc_8902.pdf',
            uploadedBy: 'a1111111-1111-4111-8111-111111111111',
            uploadedAt: '2026-10-04T11:25:00Z',
          },
        ],
        createdAt: '2026-10-04T11:20:00Z',
        updatedAt: '2026-10-04T11:20:00Z',
      },
      {
        id: 'e2',
        workspaceId: wsId,
        propertyId: prop1Id,
        unitId: null,
        categoryId: 'c2',
        vendorId: 'v3',
        description: 'Common area power and water utility bill for September',
        amount: '3240.50',
        currency: 'AED',
        expenseDate: '2026-10-08',
        status: 'paid',
        paymentMethod: 'bank_transfer',
        paidAt: '2026-10-08T09:15:00Z',
        reference: 'DEWA-2026-09-881',
        notes: 'Paid via corporate banking portal',
        createdAt: '2026-10-08T09:15:00Z',
        updatedAt: '2026-10-08T09:15:00Z',
      },
      {
        id: 'e3',
        workspaceId: wsId,
        propertyId: prop2Id,
        unitId: null,
        categoryId: 'c3',
        vendorId: 'v2',
        description: 'Bi-weekly lobby glass & marble polishing service',
        amount: '1100.00',
        currency: 'AED',
        expenseDate: '2026-10-12',
        status: 'paid',
        paymentMethod: 'card',
        paidAt: '2026-10-12T14:30:00Z',
        reference: 'REC-ESC-4412',
        notes: 'Full exterior and hallway sanitization',
        createdAt: '2026-10-12T14:30:00Z',
        updatedAt: '2026-10-12T14:30:00Z',
      },
      {
        id: 'e4',
        workspaceId: wsId,
        propertyId: prop1Id,
        unitId: u103,
        categoryId: 'c1',
        vendorId: null,
        description: 'Plumbing leak test and bathroom silicone re-grouting',
        amount: '420.00',
        currency: 'AED',
        expenseDate: '2026-10-14',
        status: 'pending',
        paymentMethod: 'cash',
        paidAt: null,
        reference: 'WO-PL-09',
        notes: 'Awaiting final inspection from property supervisor',
        createdAt: '2026-10-14T08:00:00Z',
        updatedAt: '2026-10-14T08:00:00Z',
      },
      {
        id: 'e5',
        workspaceId: wsId,
        propertyId: prop3Id,
        unitId: null,
        categoryId: 'c6',
        vendorId: null,
        description: 'Quarterly community master developer service charge',
        amount: '4650.00',
        currency: 'AED',
        expenseDate: '2026-10-01',
        status: 'paid',
        paymentMethod: 'cheque',
        paidAt: '2026-10-01T10:00:00Z',
        reference: 'CHQ-77821',
        notes: 'Q4 master developer fee paid',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      }
    );

    // Rent Charges
    const rc1 = 'rc1';
    const rc2 = 'rc2';
    const rc3 = 'rc3';

    this.rentCharges.push(
      {
        id: rc1,
        workspaceId: wsId,
        leaseId: l1,
        propertyId: prop1Id,
        unitId: u101,
        tenantId: t1,
        periodStart: '2026-10-01',
        periodEnd: '2026-12-31',
        dueDate: '2026-10-01',
        amount: '21250.00',
        paidAmount: '21250.00',
        outstandingAmount: '0.00',
        status: 'paid',
        notes: 'Q4 rent installment',
        createdAt: '2026-09-25T00:00:00Z',
        updatedAt: '2026-10-02T00:00:00Z',
      },
      {
        id: rc2,
        workspaceId: wsId,
        leaseId: l2,
        propertyId: prop1Id,
        unitId: u102,
        tenantId: t2,
        periodStart: '2026-09-01',
        periodEnd: '2026-11-30',
        dueDate: '2026-09-01',
        amount: '32500.00',
        paidAmount: '32500.00',
        outstandingAmount: '0.00',
        status: 'paid',
        notes: 'Q3 rent installment',
        createdAt: '2026-08-25T00:00:00Z',
        updatedAt: '2026-09-02T00:00:00Z',
      },
      {
        id: rc3,
        workspaceId: wsId,
        leaseId: l3,
        propertyId: prop2Id,
        unitId: u201,
        tenantId: t3,
        periodStart: '2026-08-01',
        periodEnd: '2026-10-31',
        dueDate: '2026-08-01',
        amount: '36250.00',
        paidAmount: '0.00',
        outstandingAmount: '36250.00',
        status: 'overdue',
        notes: 'Cheque 4 of 4 (Quarterly rent PDC - 3 months overdue)',
        createdAt: '2026-09-25T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      }
    );

    // Payments
    const pay1 = 'pay1';
    this.payments.push({
      id: pay1,
      workspaceId: wsId,
      tenantId: t1,
      propertyId: prop1Id,
      unitId: u101,
      amount: '21250.00',
      currency: 'AED',
      paymentDate: '2026-10-02',
      paymentMethod: 'cheque',
      reference: 'CHQ-ENBD-88901',
      notes: 'Q4 rent installment deposited to Emirates NBD',
      allocations: [
        {
          id: 'pa1',
          paymentId: pay1,
          rentChargeId: rc1,
          amount: '21250.00',
          createdAt: '2026-10-02T00:00:00Z',
        },
      ],
      createdAt: '2026-10-02T00:00:00Z',
    });

    this.allocations.push({
      id: 'pa1',
      paymentId: pay1,
      rentChargeId: rc1,
      amount: '21250.00',
      createdAt: '2026-10-02T00:00:00Z',
    });

    // Notifications
    this.notifications.push(
      {
        id: 'n1',
        workspaceId: wsId,
        userId: 'a1111111-1111-4111-8111-111111111111',
        type: 'rent_overdue',
        title: 'Rent Overdue: Unit 2001',
        message: 'Elena Rostova has an overdue rent balance of AED 12,083.33 due on 2026-10-01.',
        isRead: false,
        linkUrl: '/rent',
        createdAt: '2026-10-05T08:00:00Z',
      },
      {
        id: 'n2',
        workspaceId: wsId,
        userId: 'a1111111-1111-4111-8111-111111111111',
        type: 'lease_expiring',
        title: 'Lease Expiring Soon: Unit 2001',
        message: 'Lease for Downtown Luxury Heights 2001 ends on 2026-10-31 (17 days remaining).',
        isRead: false,
        linkUrl: '/leases',
        createdAt: '2026-10-01T08:00:00Z',
      }
    );

    // Audit logs
    this.auditLogs.push(
      {
        id: 'aud1',
        workspaceId: wsId,
        actorId: 'a1111111-1111-4111-8111-111111111111',
        actorName: 'Sultan Al Nuaimi',
        action: 'PAYMENT_RECORDED',
        entity: 'Payment',
        entityId: pay1,
        timestamp: '2026-10-02T10:15:00Z',
        changes: {
          amount: { before: null, after: '21250.00' },
          status: { before: null, after: 'paid' },
        },
      },
      {
        id: 'aud2',
        workspaceId: wsId,
        actorId: 'a2222222-2222-4222-8222-222222222222',
        actorName: 'Rami Khoury',
        action: 'EXPENSE_CREATED',
        entity: 'Expense',
        entityId: 'e1',
        timestamp: '2026-10-04T11:20:00Z',
        changes: {
          description: { before: null, after: 'AC compressor valve replacement' },
          amount: { before: null, after: '850.00' },
        },
      }
    );
  }
}
