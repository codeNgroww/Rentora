import { test } from 'node:test';
import * as assert from 'node:assert';
import { DataStoreService } from '../src/database/data-store.service';
import { ExpensesController } from '../src/modules/expenses/expenses.controller';
import { RentController } from '../src/modules/rent/rent.controller';
import { TenantsLeasesController } from '../src/modules/tenants-leases/tenants-leases.controller';
import { DashboardController } from '../src/modules/dashboard/dashboard.controller';
import { WorkspacesController } from '../src/modules/workspaces/workspaces.controller';

test('Rental SaaS Financial & Business Logic Test Suite', async (t) => {
  let dataStore: DataStoreService;
  let expensesController: ExpensesController;
  let rentController: RentController;
  let leasesController: TenantsLeasesController;
  let dashboardController: DashboardController;
  let wsId = 'c1111111-1111-4111-8111-111111111111';

  t.beforeEach(() => {
    process.env.DATA_DIR = `/tmp/rentora-test-${Date.now()}-${Math.random()}`;
    dataStore = new DataStoreService();
    dataStore.onModuleInit();
    wsId = dataStore.companies[0]?.id || dataStore.workspaces[0]?.id || 'c1111111-1111-4111-8111-111111111111';
    expensesController = new ExpensesController(dataStore);
    rentController = new RentController(dataStore);
    leasesController = new TenantsLeasesController(dataStore);
    dashboardController = new DashboardController(dataStore);
  });

  await t.test('1. Expense Lifecycle: Create, Void, and Exclude from Paid Totals', () => {
    // Initial paid total
    const initialList = expensesController.listExpenses(wsId);
    const initialPaidTotal = parseFloat(initialList.meta?.paidTotal || '0');

    // Create a new paid expense of 500 AED
    const created = expensesController.createExpense(wsId, {
      propertyId: 'p1',
      categoryId: 'c1',
      description: 'Emergency Electrical Fix',
      amount: '500.00',
      currency: 'AED',
      expenseDate: '2026-10-14',
      status: 'paid',
      paymentMethod: 'bank_transfer',
      paidAt: '2026-10-14T10:00:00Z',
    });

    assert.equal(created.success, true);
    assert.equal(created.data.amount, '500.00');

    // Check paid total increased by 500
    const afterCreateList = expensesController.listExpenses(wsId);
    const afterPaidTotal = parseFloat(afterCreateList.meta?.paidTotal || '0');
    assert.equal(afterPaidTotal, initialPaidTotal + 500);

    // Void the expense
    const voidResult = expensesController.voidExpense(created.data.id, wsId, {
      reason: 'Duplicate entry detected',
    });
    assert.equal(voidResult.data.status, 'voided');

    // Check paid total excludes voided expense
    const afterVoidList = expensesController.listExpenses(wsId);
    const afterVoidTotal = parseFloat(afterVoidList.meta?.paidTotal || '0');
    assert.equal(afterVoidTotal, initialPaidTotal);
  });

  await t.test('2. Overlapping Leases Prevention on the Same Unit', () => {
    // Unit u101 already has active lease: 2026-01-01 to 2026-12-31
    assert.throws(
      () => {
        leasesController.createLease(wsId, {
          unitId: 'u101',
          propertyId: 'p1',
          tenantId: 't2',
          startDate: '2026-06-01',
          endDate: '2027-05-31',
          annualRent: '90000.00',
        });
      },
      /already has an active lease for overlapping dates/i
    );
  });

  await t.test('3. Payment Allocation: Validates Over-Allocation and Updates Balances', () => {
    // Find an overdue or pending charge
    const charges = rentController.listCharges(wsId, 'overdue');
    assert.ok(charges.data.length > 0, 'Should have an overdue charge');

    const charge = charges.data[0];
    const outstanding = parseFloat(charge.outstandingAmount);

    // Attempt to over-allocate
    assert.throws(
      () => {
        rentController.recordPayment(wsId, {
          tenantId: charge.tenantId,
          propertyId: charge.propertyId,
          unitId: charge.unitId,
          amount: (outstanding + 5000).toFixed(2),
          paymentDate: '2026-10-14',
          allocations: [
            {
              rentChargeId: charge.id,
              amount: (outstanding + 500).toFixed(2), // Exceeds outstanding
            },
          ],
        });
      },
      /exceeds charge outstanding balance/
    );

    // Record correct full payment
    const paymentResult = rentController.recordPayment(wsId, {
      tenantId: charge.tenantId,
      propertyId: charge.propertyId,
      unitId: charge.unitId,
      amount: outstanding.toFixed(2),
      paymentDate: '2026-10-14',
      allocations: [
        {
          rentChargeId: charge.id,
          amount: outstanding.toFixed(2),
        },
      ],
    });

    assert.equal(paymentResult.success, true);

    // Verify charge is now paid with 0 outstanding
    const updatedCharge = rentController.listCharges(wsId).data.find((c) => c.id === charge.id);
    assert.equal(updatedCharge?.status, 'paid');
    assert.equal(parseFloat(updatedCharge?.outstandingAmount || '0'), 0);
  });

  await t.test('4. Dashboard Summary Calculations: Rent, Expenses, and Net Cash Flow', () => {
    const summary = dashboardController.getSummary(wsId, '2026-10');
    assert.equal(summary.success, true);
    assert.equal(summary.data.currency, 'AED');

    const rentCollected = parseFloat(summary.data.rentCollected);
    const expensesPaid = parseFloat(summary.data.expensesPaid);
    const netCashFlow = parseFloat(summary.data.netCashFlow);

    // Check net cash flow = rentCollected - expensesPaid
    assert.equal(netCashFlow, rentCollected - expensesPaid);

    // Ensure pending expenses are NOT subtracted from cash flow
    const pendingExpenses = parseFloat(summary.data.pendingExpenses);
    assert.ok(pendingExpenses >= 0);
  });

  await t.test('5. Master VAT Settings: Configurable VAT Rate (Default 5%) and Payment Tax Breakdown', () => {
    const wsController = new WorkspacesController(dataStore);

    // Verify default master VAT setting is 5%
    const initialSettings = wsController.getSettings(wsId);
    assert.equal(initialSettings.success, true);
    assert.equal(initialSettings.data.vatSettings.enabled, true);
    assert.equal(initialSettings.data.vatSettings.defaultRate, 5.0);

    // Record a payment with default 5% VAT
    const pay1 = rentController.recordPayment(wsId, {
      tenantId: 't1',
      propertyId: 'p1',
      unitId: 'u101',
      amount: '10000.00',
      paymentDate: '2026-10-15',
    });

    assert.equal(pay1.success, true);
    assert.equal(pay1.data.vatRate, 5.0);
    assert.equal(pay1.data.subtotalAmount, '10000.00');
    assert.equal(pay1.data.vatAmount, '500.00'); // 5% of 10,000 = 500
    assert.equal(pay1.data.totalAmount, '10500.00');

    // Update master VAT setting to 7.5%
    const updateRes = wsController.updateSettings(
      {
        vatSettings: {
          enabled: true,
          defaultRate: 7.5,
          trn: '100999888777003',
          calculationMode: 'exclusive',
        },
      },
      wsId
    );

    assert.equal(updateRes.success, true);
    const updatedSettings = wsController.getSettings(wsId);
    assert.equal(updatedSettings.data.vatSettings.defaultRate, 7.5);
    assert.equal(updatedSettings.data.vatSettings.trn, '100999888777003');

    // Record next payment: should use new default rate 7.5%
    const pay2 = rentController.recordPayment(wsId, {
      tenantId: 't1',
      propertyId: 'p1',
      unitId: 'u101',
      amount: '20000.00',
      paymentDate: '2026-10-15',
    });

    assert.equal(pay2.data.vatRate, 7.5);
    assert.equal(pay2.data.subtotalAmount, '20000.00');
    assert.equal(pay2.data.vatAmount, '1500.00'); // 7.5% of 20,000 = 1500
    assert.equal(pay2.data.totalAmount, '21500.00');
  });
});

