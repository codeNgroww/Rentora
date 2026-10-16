import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { Expense, ExpenseCategory, Vendor } from '@rental-saas/contracts';

@Controller()
export class ExpensesController {
  constructor(private readonly dataStore: DataStoreService) {}

  private getEffectiveWsId(wsId?: string): string {
    return wsId || this.dataStore.workspaces[0]?.id || 'w1111111-1111-4111-8111-111111111111';
  }

  // --- Categories & Vendors ---

  @Get('expense-categories')
  listCategories(@Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const categories = this.dataStore.categories.filter((c) => c.workspaceId === effectiveWsId);
    return {
      success: true,
      data: categories,
    };
  }

  @Post('expense-categories')
  createCategory(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: { name: string; color?: string }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    if (!body.name) throw new BadRequestException('Category name is required.');

    const newCat: ExpenseCategory = {
      id: `c-${Date.now()}`,
      workspaceId: effectiveWsId,
      name: body.name,
      color: body.color || '#10b981',
      isSystemDefault: false,
      createdAt: new Date().toISOString(),
    };
    this.dataStore.categories.push(newCat);
    this.dataStore.saveToFile();
    return { success: true, data: newCat };
  }

  @Get('vendors')
  listVendors(@Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const vendors = this.dataStore.vendors.filter((v) => v.workspaceId === effectiveWsId);
    return { success: true, data: vendors };
  }

  @Post('vendors')
  createVendor(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      serviceCategory?: string;
      trnOrTaxId?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    if (!body.name) throw new BadRequestException('Vendor name is required.');

    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      workspaceId: effectiveWsId,
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      serviceCategory: body.serviceCategory,
      trnOrTaxId: body.trnOrTaxId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.vendors.push(newVendor);
    this.dataStore.saveToFile();
    return { success: true, data: newVendor };
  }

  // --- Expenses ---

  @Get('expenses')
  listExpenses(
    @Headers('x-workspace-id') wsId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('propertyId') propertyId?: string,
    @Query('unitId') unitId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeVoided') includeVoided?: string
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let list = this.dataStore.expenses.filter((e) => e.workspaceId === effectiveWsId);

    // Filter by voided unless explicitly requested
    if (includeVoided !== 'true' && !status) {
      list = list.filter((e) => e.status !== 'voided');
    }

    if (status) {
      list = list.filter((e) => e.status === status);
    }
    if (propertyId) {
      list = list.filter((e) => e.propertyId === propertyId);
    }
    if (unitId) {
      list = list.filter((e) => e.unitId === unitId);
    }
    if (categoryId) {
      list = list.filter((e) => e.categoryId === categoryId);
    }
    if (from) {
      list = list.filter((e) => e.expenseDate >= from);
    }
    if (to) {
      list = list.filter((e) => e.expenseDate <= to);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.reference?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q)
      );
    }

    // Sort by expenseDate descending by default
    list.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));

    // Enrich with names
    const enriched = list.map((e) => {
      const cat = this.dataStore.categories.find((c) => c.id === e.categoryId);
      const prop = this.dataStore.properties.find((p) => p.id === e.propertyId);
      const unit = e.unitId ? this.dataStore.units.find((u) => u.id === e.unitId) : null;
      const vendor = e.vendorId ? this.dataStore.vendors.find((v) => v.id === e.vendorId) : null;

      return {
        ...e,
        categoryName: cat?.name || 'Uncategorized',
        categoryColor: cat?.color || '#10b981',
        propertyName: prop?.name || 'All Properties',
        unitNumber: unit ? unit.unitNumber : null,
        vendorName: vendor ? vendor.name : null,
      };
    });

    // Compute active totals
    const paidExpensesTotal = list
      .filter((e) => e.status === 'paid')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
      .toFixed(2);

    const pendingExpensesTotal = list
      .filter((e) => e.status === 'pending')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
      .toFixed(2);

    return {
      success: true,
      data: enriched,
      meta: {
        total: enriched.length,
        paidTotal: paidExpensesTotal,
        pendingTotal: pendingExpensesTotal,
      },
    };
  }

  @Post('expenses')
  createExpense(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      propertyId: string;
      unitId?: string | null;
      categoryId: string;
      vendorId?: string | null;
      description: string;
      amount: string;
      currency?: string;
      expenseDate: string;
      status?: any;
      paymentMethod?: any;
      paidAt?: string | null;
      reference?: string;
      notes?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);

    if (!body.propertyId || !body.categoryId || !body.description || !body.amount || !body.expenseDate) {
      throw new BadRequestException('Property, category, description, amount, and date are required.');
    }

    const amt = parseFloat(body.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const status = body.status || 'paid';
    const paidAt = status === 'paid' ? body.paidAt || new Date().toISOString() : null;

    const newExpense: Expense = {
      id: `e-${Date.now()}`,
      workspaceId: effectiveWsId,
      propertyId: body.propertyId,
      unitId: body.unitId || null,
      categoryId: body.categoryId,
      vendorId: body.vendorId || null,
      description: body.description,
      amount: amt.toFixed(2),
      currency: body.currency || 'AED',
      expenseDate: body.expenseDate,
      status,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      paidAt,
      reference: body.reference || '',
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.expenses.unshift(newExpense);

    // Audit log entry
    this.dataStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      workspaceId: effectiveWsId,
      actorId: 'system',
      actorName: 'Authorized User',
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      entityId: newExpense.id,
      timestamp: new Date().toISOString(),
      changes: {
        description: { before: null, after: newExpense.description },
        amount: { before: null, after: newExpense.amount },
        status: { before: null, after: newExpense.status },
      },
    });

    this.dataStore.saveToFile();

    return {
      success: true,
      data: newExpense,
    };
  }

  @Get('expenses/:id')
  getExpense(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const expense = this.dataStore.expenses.find(
      (e) => e.id === id && e.workspaceId === effectiveWsId
    );
    if (!expense) throw new NotFoundException('Expense not found');

    const cat = this.dataStore.categories.find((c) => c.id === expense.categoryId);
    const prop = this.dataStore.properties.find((p) => p.id === expense.propertyId);
    const vendor = expense.vendorId ? this.dataStore.vendors.find((v) => v.id === expense.vendorId) : null;

    return {
      success: true,
      data: {
        ...expense,
        categoryName: cat?.name || 'Uncategorized',
        propertyName: prop?.name || 'Unknown Property',
        vendorName: vendor?.name || null,
      },
    };
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<Expense>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.expenses.findIndex(
      (e) => e.id === id && e.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Expense not found');

    const existing = this.dataStore.expenses[idx];
    if (existing.status === 'voided') {
      throw new BadRequestException('Cannot edit a voided expense.');
    }

    // Preserve amount updates with auditing
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.expenses[idx] = updated;
    this.dataStore.saveToFile();

    return {
      success: true,
      data: updated,
    };
  }

  @Post('expenses/:id/void')
  voidExpense(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: { reason: string }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.expenses.findIndex(
      (e) => e.id === id && e.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Expense not found');

    const existing = this.dataStore.expenses[idx];
    if (existing.status === 'voided') {
      throw new BadRequestException('Expense is already voided.');
    }

    existing.status = 'voided';
    existing.voidReason = body.reason || 'Voided by user request';
    existing.updatedAt = new Date().toISOString();

    // Audit log
    this.dataStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      workspaceId: effectiveWsId,
      actorId: 'system',
      actorName: 'Authorized User',
      action: 'EXPENSE_VOIDED',
      entity: 'Expense',
      entityId: existing.id,
      timestamp: new Date().toISOString(),
      changes: {
        status: { before: 'paid', after: 'voided' },
        reason: { before: null, after: existing.voidReason },
      },
    });

    this.dataStore.saveToFile();

    return {
      success: true,
      data: existing,
    };
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.expenses.findIndex(
      (e) => e.id === id && e.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Expense not found');

    const deleted = this.dataStore.expenses.splice(idx, 1)[0];
    this.dataStore.saveToFile();

    return {
      success: true,
      data: deleted,
    };
  }

  @Post('expenses/:id/attachments')
  attachFile(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: { fileName: string; fileSize?: number; fileType?: string }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const expense = this.dataStore.expenses.find(
      (e) => e.id === id && e.workspaceId === effectiveWsId
    );
    if (!expense) throw new NotFoundException('Expense not found');

    const attachment = {
      id: `att-${Date.now()}`,
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

    return {
      success: true,
      data: attachment,
    };
  }
}
