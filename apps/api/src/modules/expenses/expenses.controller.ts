import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Optional,
  Inject,
} from '@nestjs/common';
import { Expense } from '@rental-saas/contracts';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller()
export class ExpensesController {
  private readonly expensesService: ExpensesService;

  constructor(
    @Optional() @Inject(ExpensesService) serviceOrStore?: ExpensesService | DataStoreService
  ) {
    if (serviceOrStore instanceof DataStoreService) {
      const sup = new SupabaseService();
      const act = new ActivityLogsService(sup);
      this.expensesService = new ExpensesService(serviceOrStore, sup, act);
    } else if (serviceOrStore) {
      this.expensesService = serviceOrStore;
    } else {
      const ds = new DataStoreService();
      ds.onModuleInit();
      const sup = new SupabaseService();
      const act = new ActivityLogsService(sup);
      this.expensesService = new ExpensesService(ds, sup, act);
    }
  }

  // --- Categories & Vendors ---

  @Get('expense-categories')
  listCategories(@CompanyId() companyId: string) {
    const data = this.expensesService.listCategories(companyId);
    return {
      success: true,
      data,
    };
  }

  @Post('expense-categories')
  createCategory(
    @CompanyId() companyId: string,
    @Body() body: { name: string; color?: string }
  ) {
    const data = this.expensesService.createCategory(companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Get('vendors')
  listVendors(@CompanyId() companyId: string) {
    const data = this.expensesService.listVendors(companyId);
    return {
      success: true,
      data,
    };
  }

  @Post('vendors')
  createVendor(
    @CompanyId() companyId: string,
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
    const data = this.expensesService.createVendor(companyId, body);
    return {
      success: true,
      data,
    };
  }

  // --- Expenses ---

  @Get('expenses')
  listExpenses(
    @CompanyId() companyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('propertyId') propertyId?: string,
    @Query('unitId') unitId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeVoided') includeVoided?: string
  ) {
    const res = this.expensesService.listExpenses(companyId, {
      from,
      to,
      propertyId,
      unitId,
      categoryId,
      status,
      search,
      includeVoided,
    });

    return {
      success: true,
      data: res.data,
      meta: res.meta,
    };
  }

  @Post('expenses')
  createExpense(
    @CompanyId() companyId: string,
    @Body() body: CreateExpenseDto
  ) {
    const data = this.expensesService.createExpense(companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Get('expenses/:id')
  getExpense(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = this.expensesService.getExpense(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<Expense>
  ) {
    const data = this.expensesService.updateExpense(id, companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Post('expenses/:id/void')
  voidExpense(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: { reason: string }
  ) {
    const data = this.expensesService.voidExpense(id, companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Delete('expenses/:id')
  deleteExpense(
    @Param('id') id: string,
    @CompanyId() companyId?: string
  ) {
    const data = this.expensesService.deleteExpense(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Post('expenses/:id/attachments')
  attachFile(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: { fileName: string; fileSize?: number; fileType?: string }
  ) {
    const data = this.expensesService.attachFile(id, companyId, body);
    return {
      success: true,
      data,
    };
  }
}
