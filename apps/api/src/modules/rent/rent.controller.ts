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
import { RentCharge, Payment } from '@rental-saas/contracts';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RentService } from './rent.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller()
export class RentController {
  private readonly rentService: RentService;

  constructor(
    @Optional() @Inject(RentService) serviceOrStore?: RentService | DataStoreService
  ) {
    if (serviceOrStore instanceof DataStoreService) {
      const sup = new SupabaseService();
      const act = new ActivityLogsService(sup);
      this.rentService = new RentService(serviceOrStore, sup, act);
    } else if (serviceOrStore) {
      this.rentService = serviceOrStore;
    } else {
      const ds = new DataStoreService();
      ds.onModuleInit();
      const sup = new SupabaseService();
      const act = new ActivityLogsService(sup);
      this.rentService = new RentService(ds, sup, act);
    }
  }

  @Get('rent-charges')
  listCharges(
    @CompanyId() companyId?: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const res = this.rentService.listCharges(companyId, status, propertyId, tenantId, from, to);
    return {
      success: true,
      data: res.data,
    };
  }

  @Post('rent-charges')
  createCharge(
    @CompanyId() companyId: string,
    @Body()
    body: {
      leaseId: string;
      dueDate: string;
      amount: string;
      notes?: string;
    }
  ) {
    const data = this.rentService.createCharge(companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Patch('rent-charges/:id')
  updateCharge(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<RentCharge>
  ) {
    const data = this.rentService.updateCharge(id, companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Delete('rent-charges/:id')
  deleteCharge(
    @Param('id') id: string,
    @CompanyId() companyId?: string
  ) {
    const data = this.rentService.deleteCharge(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Get('payments')
  listPayments(
    @CompanyId() companyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const data = this.rentService.listPayments(companyId, tenantId, propertyId, from, to);
    return {
      success: true,
      data,
    };
  }

  @Post('payments')
  recordPayment(
    @CompanyId() companyId: string,
    @Body() body: RecordPaymentDto
  ) {
    const data = this.rentService.recordPayment(companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Patch('payments/:id')
  updatePayment(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<Payment>
  ) {
    const data = this.rentService.updatePayment(id, companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Delete('payments/:id')
  deletePayment(
    @Param('id') id: string,
    @CompanyId() companyId?: string
  ) {
    const data = this.rentService.deletePayment(id, companyId);
    return {
      success: true,
      data,
    };
  }
}
