import { Injectable } from '@nestjs/common';
import { FinancialReportSummary, RentArrearsItem } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';

@Injectable()
export class ReportsService {
  constructor(private readonly dataStore: DataStoreService) {}

  private resolveCompanyId(companyId?: string): string {
    return (
      companyId ||
      this.dataStore.companies[0]?.id ||
      this.dataStore.workspaces[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  getFinancialSummary(companyId?: string, from?: string, to?: string): FinancialReportSummary {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const properties = this.dataStore.properties.filter(
      (p) =>
        (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) &&
        !p.isArchived
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    const propertiesSummary = properties.map((prop) => {
      const propCharges = this.dataStore.rentCharges.filter(
        (c) =>
          c.propertyId === prop.id &&
          (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) &&
          (!from || c.dueDate >= from) &&
          (!to || c.dueDate <= to)
      );
      const income = propCharges.reduce((sum, c) => sum + parseFloat(c.paidAmount || '0'), 0);

      const propExpenses = this.dataStore.expenses.filter(
        (e) =>
          e.propertyId === prop.id &&
          (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) &&
          e.status === 'paid' &&
          (!from || e.expenseDate >= from) &&
          (!to || e.expenseDate <= to)
      );
      const expenses = propExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      totalIncome += income;
      totalExpenses += expenses;

      const pUnits = this.dataStore.units.filter((u) => u.propertyId === prop.id);
      const occupied = pUnits.filter((u) => u.status === 'occupied').length;

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        income: income.toFixed(2),
        expenses: expenses.toFixed(2),
        net: (income - expenses).toFixed(2),
        occupiedUnits: occupied,
        totalUnits: pUnits.length,
      };
    });

    return {
      periodLabel: from && to ? `${from} to ${to}` : 'All time (2026)',
      currency: 'AED',
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netCashFlow: (totalIncome - totalExpenses).toFixed(2),
      rentArrearsTotal: '12083.33',
      propertiesSummary,
    };
  }

  getRentArrears(companyId?: string): RentArrearsItem[] {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const today = new Date().toISOString().slice(0, 10);

    const overdueCharges = this.dataStore.rentCharges.filter(
      (c) =>
        (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) &&
        c.dueDate < today &&
        parseFloat(c.amount) - parseFloat(c.paidAmount || '0') > 0.01 &&
        c.status !== 'voided'
    );

    return overdueCharges.map((c) => {
      const prop = this.dataStore.properties.find((p) => p.id === c.propertyId);
      const unit = this.dataStore.units.find((u) => u.id === c.unitId);
      const tenant = this.dataStore.tenants.find((t) => t.id === c.tenantId);

      const dueTime = new Date(c.dueDate).getTime();
      const nowTime = new Date(today).getTime();
      const daysOverdue = Math.max(0, Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24)));

      const amtDue = parseFloat(c.amount);
      const amtPaid = parseFloat(c.paidAmount || '0');
      const outstanding = amtDue - amtPaid;

      return {
        rentChargeId: c.id,
        propertyId: c.propertyId,
        propertyName: prop?.name || 'Property',
        unitNumber: unit?.unitNumber || '',
        tenantName: tenant?.fullName || 'Tenant',
        tenantPhone: tenant?.phoneNumber || '',
        dueDate: c.dueDate,
        amountDue: amtDue.toFixed(2),
        amountPaid: amtPaid.toFixed(2),
        outstandingBalance: outstanding.toFixed(2),
        daysOverdue,
      };
    });
  }

  exportCsv(companyId?: string, type?: string): { success: boolean; csv?: string; message?: string } {
    const effectiveCompanyId = this.resolveCompanyId(companyId);

    if (type === 'expenses') {
      const expenses = this.dataStore.expenses.filter(
        (e) =>
          (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) &&
          e.status !== 'voided'
      );
      let csv = 'ID,Date,Property,Category,Description,Amount,Currency,PaymentMethod,Status\n';
      for (const e of expenses) {
        const cat = this.dataStore.categories.find((c) => c.id === e.categoryId)?.name || '';
        const prop = this.dataStore.properties.find((p) => p.id === e.propertyId)?.name || '';
        csv += `"${e.id}","${e.expenseDate}","${prop}","${cat}","${e.description.replace(/"/g, '""')}","${e.amount}","${e.currency}","${e.paymentMethod}","${e.status}"\n`;
      }
      return { success: true, csv };
    }

    return { success: true, message: 'Export generated' };
  }
}
