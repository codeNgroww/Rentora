import { Injectable } from '@nestjs/common';
import { NotificationItem, AuditLogItem } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';

@Injectable()
export class NotificationsAuditService {
  constructor(private readonly dataStore: DataStoreService) {}

  private resolveCompanyId(companyId?: string): string {
    return (
      companyId ||
      this.dataStore.companies[0]?.id ||
      this.dataStore.workspaces[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  listNotifications(companyId?: string): NotificationItem[] {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    return this.dataStore.notifications.filter(
      (n) => n.companyId === effectiveCompanyId || (n as any).workspaceId === effectiveCompanyId
    );
  }

  markAsRead(id: string, companyId?: string): NotificationItem | undefined {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const item = this.dataStore.notifications.find(
      (n) =>
        n.id === id &&
        (n.companyId === effectiveCompanyId || (n as any).workspaceId === effectiveCompanyId)
    );
    if (item) {
      item.isRead = true;
      this.dataStore.saveToFile();
    }
    return item;
  }

  listAuditLogs(companyId?: string, limit?: string): AuditLogItem[] {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const max = limit ? parseInt(limit, 10) : 50;
    return this.dataStore.auditLogs
      .filter(
        (a) =>
          a.companyId === effectiveCompanyId || (a as any).workspaceId === effectiveCompanyId
      )
      .slice(0, max);
  }
}
