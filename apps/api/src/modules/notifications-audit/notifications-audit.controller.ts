import { Controller, Get, Patch, Param, Headers, Query } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';

@Controller()
export class NotificationsAuditController {
  constructor(private readonly dataStore: DataStoreService) {}

  private getEffectiveWsId(wsId?: string): string {
    return wsId || this.dataStore.workspaces[0]?.id || 'w1111111-1111-4111-8111-111111111111';
  }

  @Get('notifications')
  listNotifications(@Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const items = this.dataStore.notifications.filter((n) => n.workspaceId === effectiveWsId);
    return {
      success: true,
      data: items,
    };
  }

  @Patch('notifications/:id/read')
  markAsRead(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const item = this.dataStore.notifications.find(
      (n) => n.id === id && n.workspaceId === effectiveWsId
    );
    if (item) {
      item.isRead = true;
      this.dataStore.saveToFile();
    }
    return {
      success: true,
      data: item,
    };
  }

  @Get('audit-logs')
  listAuditLogs(@Headers('x-workspace-id') wsId?: string, @Query('limit') limit?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const max = limit ? parseInt(limit, 10) : 50;
    const logs = this.dataStore.auditLogs
      .filter((a) => a.workspaceId === effectiveWsId)
      .slice(0, max);
    return {
      success: true,
      data: logs,
    };
  }
}
