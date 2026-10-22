import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { NotificationsAuditService } from './notifications-audit.service';

@Controller()
export class NotificationsAuditController {
  constructor(private readonly notificationsAuditService: NotificationsAuditService) {}

  @Get('notifications')
  listNotifications(@CompanyId() companyId?: string) {
    const data = this.notificationsAuditService.listNotifications(companyId);
    return {
      success: true,
      data,
    };
  }

  @Patch('notifications/:id/read')
  markAsRead(@Param('id') id: string, @CompanyId() companyId?: string) {
    const data = this.notificationsAuditService.markAsRead(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Get('audit-logs')
  listAuditLogs(@CompanyId() companyId?: string, @Query('limit') limit?: string) {
    const data = this.notificationsAuditService.listAuditLogs(companyId, limit);
    return {
      success: true,
      data,
    };
  }
}
