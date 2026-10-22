import { Controller, Get, Query } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getFinancialSummary(
    @CompanyId() companyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const data = this.reportsService.getFinancialSummary(companyId, from, to);
    return {
      success: true,
      data,
    };
  }

  @Get('rent-arrears')
  getRentArrears(@CompanyId() companyId?: string) {
    const data = this.reportsService.getRentArrears(companyId);
    return {
      success: true,
      data,
    };
  }

  @Get('export-csv')
  exportCsv(
    @CompanyId() companyId?: string,
    @Query('type') type?: string
  ) {
    return this.reportsService.exportCsv(companyId, type);
  }
}
