import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Expense, ExpenseCategory, Vendor, ExpenseStatus } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly activityLogsService: ActivityLogsService
  ) {}

  private resolveCompanyId(companyId?: string): string {
    return (
      companyId ||
      this.dataStore.companies[0]?.id ||
      this.dataStore.workspaces[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  // --- Categories & Vendors ---

  listCategories(companyId?: string): ExpenseCategory[] {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    return this.dataStore.categories.filter(
      (c) =>
        (!c.companyId || c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId || c.isSystemDefault) &&
        !c.isDeleted
    );
  }

  createCategory(companyId: string | undefined, body: { name: string; color?: string }): ExpenseCategory {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (!body.name) throw new BadRequestException('Category name is required.');

    const newCat: ExpenseCategory = {
      id: randomUUID(),
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      name: body.name,
      color: body.color || '#10b981',
      isSystemDefault: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
    this.dataStore.categories.push(newCat);
    this.dataStore.saveToFile();
    return newCat;
  }

  listVendors(companyId?: string): Vendor[] {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    return this.dataStore.vendors.filter(
      (v) => (v.companyId === effectiveCompanyId || (v as any).workspaceId === effectiveCompanyId) && !v.isDeleted
    );
  }

  createVendor(
    companyId: string | undefined,
    body: {
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      serviceCategory?: string;
      trnOrTaxId?: string;
    }
  ): Vendor {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (!body.name) throw new BadRequestException('Vendor name is required.');

    const newVendor: Vendor = {
      id: randomUUID(),
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      serviceCategory: body.serviceCategory,
      trnOrTaxId: body.trnOrTaxId,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.vendors.push(newVendor);
    this.dataStore.saveToFile();
    return newVendor;
  }

  // --- Expenses ---

  listExpenses(
    companyId?: string,
    filters?: {
      from?: string;
      to?: string;
      propertyId?: string;
      unitId?: string;
      categoryId?: string;
      status?: string;
      search?: string;
      includeVoided?: string;
    }
  ): { data: any[]; meta: { total: number; paidTotal: string; pendingTotal: string } } {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    let list = this.dataStore.expenses.filter(
      (e) => (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) && !e.isDeleted
    );

    if (filters?.includeVoided !== 'true' && !filters?.status) {
      list = list.filter((e) => e.status !== 'voided');
    }

    if (filters?.status) {
      list = list.filter((e) => e.status === filters.status);
    }
    if (filters?.propertyId) {
      list = list.filter((e) => e.propertyId === filters.propertyId);
    }
    if (filters?.unitId) {
      list = list.filter((e) => e.unitId === filters.unitId);
    }
    if (filters?.categoryId) {
      list = list.filter((e) => e.categoryId === filters.categoryId);
    }
    if (filters?.from) {
      list = list.filter((e) => e.expenseDate >= filters.from!);
    }
    if (filters?.to) {
      list = list.filter((e) => e.expenseDate <= filters.to!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.reference?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));

    const enriched = list.map((e) => {
      const cat = this.dataStore.categories.find((c) => c.id === e.categoryId && !c.isDeleted);
      const prop = this.dataStore.properties.find((p) => p.id === e.propertyId && !p.isDeleted);
      const unit = e.unitId ? this.dataStore.units.find((u) => u.id === e.unitId && !u.isDeleted) : null;
      const vendor = e.vendorId ? this.dataStore.vendors.find((v) => v.id === e.vendorId && !v.isDeleted) : null;

      return {
        ...e,
        categoryName: cat?.name || 'Uncategorized',
        categoryColor: cat?.color || '#10b981',
        propertyName: prop?.name || 'All Properties',
        unitNumber: unit ? unit.unitNumber : null,
        vendorName: vendor ? vendor.name : null,
      };
    });

    const nonVoided = list.filter((e) => e.status !== 'voided');
    const total = nonVoided.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const paidTotal = nonVoided
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const pendingTotal = nonVoided
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return {
      data: enriched,
      meta: {
        total,
        paidTotal: paidTotal.toFixed(2),
        pendingTotal: pendingTotal.toFixed(2),
      },
    };
  }

  createExpense(companyId: string | undefined, body: CreateExpenseDto): Expense {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (!body.propertyId || !body.categoryId || !body.amount || !body.expenseDate) {
      throw new BadRequestException('propertyId, categoryId, amount, and expenseDate are required.');
    }

    const amt = parseFloat(body.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new BadRequestException('Amount must be a positive number.');
    }

    const prop = this.dataStore.properties.find(
      (p) => p.id === body.propertyId && (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) && !p.isDeleted
    );
    if (!prop) {
      throw new NotFoundException(`Property with id ${body.propertyId} not found.`);
    }

    const cat = this.dataStore.categories.find((c) => c.id === body.categoryId && !c.isDeleted);
    if (!cat) {
      throw new NotFoundException(`Category with id ${body.categoryId} not found.`);
    }

    if (body.unitId) {
      const unit = this.dataStore.units.find(
        (u) => u.id === body.unitId && u.propertyId === body.propertyId && !u.isDeleted
      );
      if (!unit) {
        throw new NotFoundException(`Unit with id ${body.unitId} not found in this property.`);
      }
    }

    if (body.vendorId) {
      const vendor = this.dataStore.vendors.find(
        (v) => v.id === body.vendorId && (v.companyId === effectiveCompanyId || (v as any).workspaceId === effectiveCompanyId) && !v.isDeleted
      );
      if (!vendor) {
        throw new NotFoundException(`Vendor with id ${body.vendorId} not found.`);
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const status: ExpenseStatus = (body.status as ExpenseStatus) || 'paid';
    const paidAt = status === 'paid' ? now : null;

    const newExpense: Expense = {
      id,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      propertyId: body.propertyId,
      unitId: body.unitId || null,
      categoryId: body.categoryId,
      vendorId: body.vendorId || null,
      description: body.description,
      amount: amt.toFixed(2),
      currency: body.currency || 'AED',
      expenseDate: body.expenseDate,
      status,
      paymentMethod: (body.paymentMethod as any) || 'bank_transfer',
      paidAt,
      reference: body.reference || '',
      notes: body.notes || '',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        Promise.resolve(
          client.from('expenses').insert({
            id: newExpense.id,
            company_id: newExpense.companyId,
            property_id: newExpense.propertyId,
            unit_id: newExpense.unitId,
            category_id: newExpense.categoryId,
            vendor_id: newExpense.vendorId,
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            currency: newExpense.currency,
            expense_date: newExpense.expenseDate,
            status: newExpense.status,
            payment_method: newExpense.paymentMethod,
            paid_at: newExpense.paidAt,
            reference: newExpense.reference,
            notes: newExpense.notes,
            is_deleted: false,
            created_at: newExpense.createdAt,
            updated_at: newExpense.updatedAt,
          })
        ).catch((err) => {
          this.logger.warn(`Failed to insert expense into Supabase: ${(err as Error).message}`);
        });
      }
    }

    this.dataStore.expenses.unshift(newExpense);
    this.dataStore.saveToFile();

    void this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: newExpense.propertyId,
      collectionName: 'expenses',
      recordId: newExpense.id,
      action: 'CREATE',
      newData: newExpense,
      actorName: 'Authorized User',
    });

    return newExpense;
  }

  getExpense(id: string, companyId?: string): any {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const expense = this.dataStore.expenses.find(
      (e) => e.id === id && (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) && !e.isDeleted
    );
    if (!expense) throw new NotFoundException('Expense not found');

    const cat = this.dataStore.categories.find((c) => c.id === expense.categoryId && !c.isDeleted);
    const prop = this.dataStore.properties.find((p) => p.id === expense.propertyId && !p.isDeleted);
    const vendor = expense.vendorId ? this.dataStore.vendors.find((v) => v.id === expense.vendorId && !v.isDeleted) : null;

    return {
      ...expense,
      categoryName: cat?.name || 'Uncategorized',
      propertyName: prop?.name || 'Unknown Property',
      vendorName: vendor?.name || null,
    };
  }

  updateExpense(id: string, companyId: string | undefined, body: Partial<Expense>): Expense {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.expenses.findIndex(
      (e) => e.id === id && (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) && !e.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Expense not found');

    const existing = this.dataStore.expenses[idx];
    if (existing.status === 'voided') {
      throw new BadRequestException('Cannot edit a voided expense.');
    }

    const oldData = { ...existing };
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.expenses[idx] = updated;
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        void client.from('expenses').update({
          description: updated.description,
          amount: parseFloat(updated.amount),
          expense_date: updated.expenseDate,
          status: updated.status,
          updated_at: updated.updatedAt,
        }).eq('id', id);
      }
    }

    void this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: updated.propertyId,
      collectionName: 'expenses',
      recordId: id,
      action: 'UPDATE',
      oldData,
      newData: updated,
      actorName: 'Authorized User',
    });

    return updated;
  }

  voidExpense(id: string, companyId: string | undefined, body: { reason: string }): Expense {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.expenses.findIndex(
      (e) => e.id === id && (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) && !e.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Expense not found');

    const existing = this.dataStore.expenses[idx];
    if (existing.status === 'voided') {
      throw new BadRequestException('Expense is already voided.');
    }

    const oldData = { ...existing };
    existing.status = 'voided';
    existing.voidReason = body.reason || 'Voided by user request';
    existing.updatedAt = new Date().toISOString();
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        void client.from('expenses').update({
          status: 'voided',
          notes: `${existing.notes || ''} [Void Reason: ${existing.voidReason}]`.trim(),
          updated_at: existing.updatedAt,
        }).eq('id', id);
      }
    }

    void this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: existing.propertyId,
      collectionName: 'expenses',
      recordId: id,
      action: 'UPDATE',
      oldData,
      newData: existing,
      actorName: 'Authorized User',
    });

    return existing;
  }

  deleteExpense(id: string, companyId?: string): Expense {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.expenses.findIndex(
      (e) => e.id === id && (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) && !e.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Expense not found');

    const now = new Date().toISOString();
    const expense = this.dataStore.expenses[idx];
    expense.isDeleted = true;
    expense.deletedAt = now;
    expense.updatedAt = now;
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        void client.from('expenses').update({ is_deleted: true, deleted_at: now }).eq('id', id);
      }
    }

    void this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: expense.propertyId,
      collectionName: 'expenses',
      recordId: id,
      action: 'DELETE',
      oldData: expense,
      actorName: 'Authorized User',
    });

    return expense;
  }

  attachFile(
    id: string,
    companyId: string | undefined,
    body: { fileName: string; fileSize?: number; fileType?: string }
  ): any {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const expense = this.dataStore.expenses.find(
      (e) => e.id === id && (e.companyId === effectiveCompanyId || (e as any).workspaceId === effectiveCompanyId) && !e.isDeleted
    );
    if (!expense) throw new NotFoundException('Expense not found');

    const attachment = {
      id: randomUUID(),
      expenseId: expense.id,
      fileName: body.fileName || 'receipt.pdf',
      fileSize: body.fileSize || 102400,
      fileType: body.fileType || 'application/pdf',
      storagePath: `receipts/${expense.id}/${body.fileName}`,
      signedUrl: `https://storage.supabase.co/v1/object/sign/receipts/${expense.id}/${body.fileName}?token=mock-token`,
      uploadedBy: 'system',
      uploadedAt: new Date().toISOString(),
    };

    if (!expense.attachments) expense.attachments = [];
    expense.attachments.push(attachment);
    this.dataStore.saveToFile();

    return attachment;
  }
}
