import { Injectable } from '@nestjs/common';
import { DashboardSummary } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';

@Injectable()
export class DashboardService {
  constructor(private readonly dataStore: DataStoreService) {}

  private resolveCompanyId(companyId?: string): string {
    return (
      companyId ||
      this.dataStore.companies[0]?.id ||
      this.dataStore.workspaces[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  getSummary(
    companyId?: string,
    period?: string,
    propertyId?: string,
    from?: string,
    to?: string
  ): DashboardSummary {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const targetPeriod = period || '2026-10';

    let properties = this.dataStore.properties.filter(
      (p) =>
        (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) &&
        !p.isArchived &&
        !p.isDeleted
    );
    if (propertyId) {
      properties = properties.filter((p) => p.id === propertyId);
    }
    const propertyIds = new Set(properties.map((p) => p.id));

    const units = this.dataStore.units.filter(
      (u) =>
        (u.companyId === effectiveCompanyId || (u as any).workspaceId === effectiveCompanyId) &&
        propertyIds.has(u.propertyId) &&
        !u.isDeleted
    );
    const occupiedUnits = units.filter((u) => u.status === 'occupied').length;
    const vacantUnits = units.length - occupiedUnits;
    const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

    const charges = this.dataStore.rentCharges.filter((c) => {
      const matchComp =
        c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId;
      if (!matchComp || !propertyIds.has(c.propertyId) || c.status === 'voided' || c.isDeleted) {
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

    const expenses = this.dataStore.expenses.filter((e) => {
      const matchComp =
        e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId;
      if (!matchComp || !propertyIds.has(e.propertyId) || e.status === 'voided' || e.isDeleted) {
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

    const catMap = new Map<string, number>();
    for (const exp of expenses.filter((e) => e.status === 'paid')) {
      const current = catMap.get(exp.categoryId) || 0;
      catMap.set(exp.categoryId, current + parseFloat(exp.amount));
    }

    const categoryBreakdown = Array.from(catMap.entries()).map(([catId, amountNum]) => {
      const cat = this.dataStore.categories.find((c) => c.id === catId && !c.isDeleted);
      return {
        categoryId: catId,
        categoryName: cat?.name || 'Other',
        color: cat?.color || '#10b981',
        amount: amountNum.toFixed(2),
        percentage: paidExpensesNum > 0 ? Math.round((amountNum / paidExpensesNum) * 100) : 0,
      };
    });

    const recentActivity = [
      ...this.dataStore.payments
        .filter(
          (p) =>
            (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) &&
            !p.isDeleted
        )
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
        .filter(
          (e) =>
            (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) &&
            e.status !== 'voided' &&
            !e.isDeleted
        )
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

    return {
      workspaceId: effectiveCompanyId,
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
  }
}
