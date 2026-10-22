import { Controller, Get, Query, Optional, Inject } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { DataStoreService } from '../../database/data-store.service';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  private readonly dashboardService: DashboardService;

  constructor(
    @Optional() @Inject(DashboardService) serviceOrStore?: DashboardService | DataStoreService
  ) {
    if (serviceOrStore instanceof DataStoreService) {
      this.dashboardService = new DashboardService(serviceOrStore);
    } else if (serviceOrStore) {
      this.dashboardService = serviceOrStore;
    } else {
      const ds = new DataStoreService();
      ds.onModuleInit();
      this.dashboardService = new DashboardService(ds);
    }
  }

  @Get('summary')
  getSummary(
    @CompanyId() companyId?: string,
    @Query('period') period?: string,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const summary = this.dashboardService.getSummary(companyId, period, propertyId, from, to);
    return {
      success: true,
      data: summary,
    };
  }
}
