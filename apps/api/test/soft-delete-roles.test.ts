import { test } from 'node:test';
import * as assert from 'node:assert';
import { ROLE_MODULE_PERMISSIONS } from '@rental-saas/contracts';
import { DataStoreService } from '../src/database/data-store.service';
import { SupabaseService } from '../src/database/supabase.service';
import { ActivityLogsService } from '../src/modules/activity-logs/activity-logs.service';
import { SuperAdminService } from '../src/modules/super-admin/super-admin.service';
import { PropertiesService } from '../src/modules/properties/properties.service';
import { TenantsLeasesService } from '../src/modules/tenants-leases/tenants-leases.service';
import { ExpensesService } from '../src/modules/expenses/expenses.service';
import { RentService } from '../src/modules/rent/rent.service';
import { AuthService } from '../src/modules/auth/auth.service';

test('Soft Delete, Users Table & Role-Based Module Permissions Test Suite', async (t) => {
  let dataStore: DataStoreService;
  let supabaseService: SupabaseService;
  let activityLogsService: ActivityLogsService;
  let superAdminService: SuperAdminService;
  let propertiesService: PropertiesService;
  let tenantsLeasesService: TenantsLeasesService;
  let expensesService: ExpensesService;
  let rentService: RentService;
  let authService: AuthService;

  t.beforeEach(() => {
    process.env.DATA_DIR = `/tmp/rentora-softdelete-test-${Date.now()}-${Math.random()}`;
    dataStore = new DataStoreService();
    dataStore.onModuleInit();
    supabaseService = new SupabaseService();
    activityLogsService = new ActivityLogsService(supabaseService);
    superAdminService = new SuperAdminService(dataStore, supabaseService, activityLogsService);
    propertiesService = new PropertiesService(dataStore, supabaseService, activityLogsService);
    tenantsLeasesService = new TenantsLeasesService(dataStore, supabaseService, activityLogsService);
    expensesService = new ExpensesService(dataStore, supabaseService, activityLogsService);
    rentService = new RentService(dataStore, supabaseService, activityLogsService);
    authService = new AuthService(dataStore, supabaseService, activityLogsService);
  });

  await t.test('1. Super Admin Presence & Role Permissions', async () => {
    // Super admin must exist in users table/store
    const superAdmin = dataStore.users.find((u) => u.role === 'super_admin');
    assert.ok(superAdmin, 'Super Admin must exist in users store');
    assert.equal(superAdmin.role, 'super_admin');
    assert.equal(superAdmin.isDeleted, false);

    // Auth verification for Super Admin
    const authResult = await authService.login({ email: 'superadmin@rentora.ae' });
    assert.equal(authResult.isSuperAdmin, true);
    assert.equal(authResult.user.role, 'super_admin');
    assert.ok(authResult.user.permissions?.includes('companies'), 'Super admin must have companies permission');
  });

  await t.test('2. Company Onboarding: Auto-provisions Company User with role: admin', async () => {
    const newCompany = await superAdminService.createCompany({
      name: 'Emaar Properties LLC',
      tradeLicenseNo: 'TL-DXB-998877',
      trn: '100998877665543',
      emirate: 'Dubai',
      poc: {
        fullName: 'Rashid Al Nuaimi',
        email: 'rashid.nuaimi@emaar.ae',
        phone: '+971 50 999 8888',
        password: 'Password@123',
      },
    });

    assert.ok(newCompany.id);
    assert.equal(newCompany.isDeleted, false);

    // Verify admin user was automatically created in users store
    const users = await superAdminService.getCompanyUsers(newCompany.id);
    assert.ok(users.length >= 1, 'Expected at least 1 user for onboarded company');
    const adminUser = users.find((u) => (u.email || u.userEmail) === 'rashid.nuaimi@emaar.ae');
    assert.ok(adminUser, 'Admin user must be provisioned for company POC');
    assert.equal(adminUser.role, 'admin');
    assert.equal(adminUser.isDeleted, false);

    // Verify Admin role module permissions: ALL modules EXCEPT 'companies'
    const adminPermissions = ROLE_MODULE_PERMISSIONS.admin;
    assert.equal(adminPermissions.includes('companies'), false, 'Admin must NOT have access to companies module');
    assert.ok(adminPermissions.includes('properties'), 'Admin must have properties permission');
    assert.ok(adminPermissions.includes('rent'), 'Admin must have rent permission');
    assert.ok(adminPermissions.includes('expenses'), 'Admin must have expenses permission');
    assert.ok(adminPermissions.includes('tenants'), 'Admin must have tenants permission');
    assert.ok(adminPermissions.includes('leases'), 'Admin must have leases permission');
    assert.ok(adminPermissions.includes('dashboard'), 'Admin must have dashboard permission');
    assert.ok(adminPermissions.includes('users'), 'Admin must have users permission');
  });

  await t.test('3. Extended Roles: Provision Accountant, HR, Manager, Viewer', async () => {
    const company = dataStore.companies[0];
    assert.ok(company);

    // Create Accountant
    const accountant = await superAdminService.createCompanyUser(company.id, {
      fullName: 'Farooq Finance',
      userEmail: 'farooq.finance@example.ae',
      role: 'accountant',
    });
    assert.equal(accountant.role, 'accountant');
    assert.equal(accountant.isDeleted, false);

    // Create HR
    const hr = await superAdminService.createCompanyUser(company.id, {
      fullName: 'Hessa HR',
      userEmail: 'hessa.hr@example.ae',
      role: 'hr',
    });
    assert.equal(hr.role, 'hr');
    assert.equal(hr.isDeleted, false);

    // Role Module Permissions check
    assert.deepEqual(
      ROLE_MODULE_PERMISSIONS.accountant.sort(),
      ['rent', 'expenses', 'dashboard', 'reports', 'properties', 'units', 'leases'].sort()
    );
    assert.deepEqual(
      ROLE_MODULE_PERMISSIONS.hr.sort(),
      ['users', 'dashboard', 'activity_logs'].sort()
    );
  });

  await t.test('4. Universal Soft Delete: Property, Unit, Tenant, Lease, Expense, RentCharge, Payment', async () => {
    const company = dataStore.companies[0];
    const compId = company.id;

    // 1. Property & Unit Soft Delete
    const prop = await propertiesService.createProperty(
      {
        name: 'Marina Pearl Tower',
        type: 'residential',
        address: 'Dubai Marina',
        emirate: 'Dubai',
        numberOfFloors: 2,
        unitsPerFloor: 2,
      },
      compId
    );
    assert.equal(prop.isDeleted, false);

    // Verify units were generated
    const initialUnits = await propertiesService.listUnitsForProperty(prop.id, compId);
    assert.equal(initialUnits.length, 4);

    // Soft delete one unit
    const unitToDelete = initialUnits[0];
    const deletedUnit = await propertiesService.deleteUnit(unitToDelete.id, compId);
    assert.equal(deletedUnit.isDeleted, true);
    assert.ok(deletedUnit.deletedAt);

    // Verify unit is excluded from list
    const remainingUnits = await propertiesService.listUnitsForProperty(prop.id, compId);
    assert.equal(remainingUnits.length, 3);
    assert.equal(remainingUnits.some((u) => u.id === unitToDelete.id), false);

    // Verify record is preserved in dataStore (not spliced/hard-deleted)
    const rawUnit = dataStore.units.find((u) => u.id === unitToDelete.id);
    assert.ok(rawUnit, 'Record must be retained in database/store for audit history');
    assert.equal(rawUnit.isDeleted, true);

    // Soft delete entire property
    const deletedProp = await propertiesService.deleteProperty(prop.id, compId);
    assert.equal(deletedProp.isDeleted, true);
    assert.ok(deletedProp.deletedAt);

    // Verify property is excluded from active properties list
    const activeProps = await propertiesService.listProperties(compId);
    assert.equal(activeProps.some((p) => p.id === prop.id), false);

    // 2. Tenant & Lease Soft Delete
    const tenant = await tenantsLeasesService.createTenant(
      {
        fullName: 'Khalid Mansoori',
        email: 'khalid.m@example.ae',
        phoneNumber: '+971 50 444 5555',
      },
      compId
    );
    assert.equal(tenant.isDeleted, false);

    const deletedTenant = await tenantsLeasesService.deleteTenant(tenant.id, compId);
    assert.equal(deletedTenant.isDeleted, true);
    assert.ok(deletedTenant.deletedAt);

    // Verify tenant excluded from active list
    const activeTenants = await tenantsLeasesService.listTenants(compId);
    assert.equal(activeTenants.some((t) => t.id === tenant.id), false);

    // 3. Expense Soft Delete
    const activeProp = await propertiesService.createProperty(
      {
        name: 'Downtown Commercial Hub',
        type: 'commercial',
        address: 'Downtown Dubai',
        emirate: 'Dubai',
      },
      compId
    );

    const expense = expensesService.createExpense(compId, {
      propertyId: activeProp.id,
      categoryId: 'c1',
      description: 'HVAC Duct Disinfection',
      amount: '800.00',
      currency: 'AED',
      expenseDate: '2026-10-15',
    });
    assert.equal(expense.isDeleted, false);

    const deletedExpense = expensesService.deleteExpense(expense.id, compId);
    assert.equal(deletedExpense.isDeleted, true);
    assert.ok(deletedExpense.deletedAt);

    // Verify excluded from listExpenses
    const activeExpenses = expensesService.listExpenses(compId);
    assert.equal(activeExpenses.data.some((e) => e.id === expense.id), false);

    // 4. Rent Charge & Payment Soft Delete
    const activeTenant = await tenantsLeasesService.createTenant(
      {
        fullName: 'Omar Al Zaabi',
        email: 'omar.z@example.ae',
        phoneNumber: '+971 50 123 9999',
      },
      compId
    );

    const unitForLease = await propertiesService.createUnit(
      activeProp.id,
      {
        unitNumber: 'COMM-101',
        marketRent: '100000.00',
        type: 'commercial',
      },
      compId
    );

    const lease = tenantsLeasesService.createLease(
      {
        tenantId: activeTenant.id,
        propertyId: activeProp.id,
        unitId: unitForLease.id,
        startDate: '2026-11-01',
        endDate: '2027-10-31',
        annualRent: '100000.00',
      },
      compId
    );
    assert.equal(lease.isDeleted, false);

    const charge = rentService.createCharge(compId, {
      leaseId: lease.id,
      dueDate: '2026-11-01',
      amount: '25000.00',
      notes: 'Upcoming Quarter PDC',
    });
    assert.equal(charge.isDeleted, false);

    const deletedCharge = rentService.deleteCharge(charge.id, compId);
    assert.equal(deletedCharge.isDeleted, true);
    assert.ok(deletedCharge.deletedAt);

    const activeCharges = rentService.listCharges(compId);
    assert.equal(activeCharges.data.some((c) => c.id === charge.id), false);
  });
});
