import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityAction } from '@rental-saas/contracts';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async getLogs(
    @Headers('x-company-id') companyIdHeader?: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
    @Query('propertyId') propertyId?: string,
    @Query('collection') collectionName?: string,
    @Query('action') action?: ActivityAction,
    @Query('limit') limitStr?: string
  ) {
    const effectiveCompanyId =
      companyIdHeader || workspaceIdHeader || 'c1111111-1111-4111-8111-111111111111';
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const data = await this.activityLogsService.listLogs({
      companyId: effectiveCompanyId,
      propertyId,
      collectionName,
      action,
      limit,
    });

    return {
      success: true,
      data,
      meta: {
        total: data.length,
        limit,
      },
    };
  }
}
