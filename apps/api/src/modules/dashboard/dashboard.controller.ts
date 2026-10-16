import { Controller, Get, Query, Headers } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { DashboardSummary } from '@rental-saas/contracts';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dataStore: DataStoreService) {}

  private getEffectiveWsId(wsId?: string): string {
    return wsId || this.dataStore.workspaces[0]?.id || 'w1111111-1111-4111-8111-111111111111';
  }

  @Get('summary')
  getSummary(
    @Headers('x-workspace-id') wsId?: string,
    @Query('period') period?: string,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const targetPeriod = period || '2026-10'; // YYYY-MM or YYYY

    // Filter properties
    let properties = this.dataStore.properties.filter(
      (p) => p.workspaceId === effectiveWsId && !p.isArchived
    );
    if (propertyId) {
      properties = properties.filter((p) => p.id === propertyId);
    }
    const propertyIds = new Set(properties.map((p) => p.id));

    // Units
    const units = this.dataStore.units.filter(
      (u) => u.workspaceId === effectiveWsId && propertyIds.has(u.propertyId)
    );
    const occupiedUnits = units.filter((u) => u.status === 'occupied').length;
    const vacantUnits = units.length - occupiedUnits;
    const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

    // Rent charges for period or date range
    const charges = this.dataStore.rentCharges.filter((c) => {
      if (c.workspaceId !== effectiveWsId || !propertyIds.has(c.propertyId) || c.status === 'voided') {
        return false;
      }
      if (from && to) {
        return c.dueDate >= from && c.dueDate <= to;
      }
      return c.dueDate.startsWith(targetPeriod);
    });

    const rentDueNum = charges.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const rentCollectedNum = charges.reduce((sum, c) => sum + parseFloat(c.paidAmount || '0'), 0);
    const rentOutstandingNum = Math.max(0, rentDueNum - rentCollectedNum);

    // Expenses for period or date range
    const expenses = this.dataStore.expenses.filter((e) => {
      if (e.workspaceId !== effectiveWsId || !propertyIds.has(e.propertyId) || e.status === 'voided') {
        return false;
      }
      if (from && to) {
        return e.expenseDate >= from && e.expenseDate <= to;
      }
      return e.expenseDate.startsWith(targetPeriod);
    });

    const paidExpensesNum = expenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const pendingExpensesNum = expenses
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const netCashFlowNum = rentCollectedNum - paidExpensesNum;

    // Category breakdown
    const catMap = new Map<string, number>();
    for (const exp of expenses.filter((e) => e.status === 'paid')) {
      const current = catMap.get(exp.categoryId) || 0;
      catMap.set(exp.categoryId, current + parseFloat(exp.amount));
    }

    const categoryBreakdown = Array.from(catMap.entries()).map(([catId, amountNum]) => {
      const cat = this.dataStore.categories.find((c) => c.id === catId);
      return {
        categoryId: catId,
        categoryName: cat?.name || 'Other',
        color: cat?.color || '#10b981',
        amount: amountNum.toFixed(2),
        percentage: paidExpensesNum > 0 ? Math.round((amountNum / paidExpensesNum) * 100) : 0,
      };
    });

    // Recent activity (latest 5 events)
    const recentActivity = [
      ...this.dataStore.payments
        .filter((p) => p.workspaceId === effectiveWsId)
        .map((p) => ({
          id: p.id,
          type: 'rent_payment' as const,
          title: `Rent Payment Received`,
          subtitle: `Reference: ${p.reference || 'Bank Transfer'}`,
          amount: `+AED ${parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          date: p.paymentDate,
          status: 'success',
        })),
      ...this.dataStore.expenses
        .filter((e) => e.workspaceId === effectiveWsId && e.status !== 'voided')
        .map((e) => ({
          id: e.id,
          type: 'expense' as const,
          title: e.description,
          subtitle: `Category: ${this.dataStore.categories.find((c) => c.id === e.categoryId)?.name || 'General'}`,
          amount: `-AED ${parseFloat(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          date: e.expenseDate,
          status: e.status,
        })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    const summary: DashboardSummary = {
      workspaceId: effectiveWsId,
      period: targetPeriod,
      currency: 'AED',
      propertyCount: properties.length,
      totalUnits: units.length,
      occupiedUnits,
      vacantUnits,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      rentDue: rentDueNum.toFixed(2),
      rentCollected: rentCollectedNum.toFixed(2),
      rentOutstanding: rentOutstandingNum.toFixed(2),
      expensesPaid: paidExpensesNum.toFixed(2),
      pendingExpenses: pendingExpensesNum.toFixed(2),
      netCashFlow: netCashFlowNum.toFixed(2),
      categoryBreakdown,
      recentActivity,
    };

    return {
      success: true,
      data: summary,
    };
  }
}
