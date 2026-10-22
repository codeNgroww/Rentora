import { Module } from '@nestjs/common';
import { NotificationsAuditController } from './notifications-audit.controller';
import { NotificationsAuditService } from './notifications-audit.service';

@Module({
  controllers: [NotificationsAuditController],
  providers: [NotificationsAuditService],
  exports: [NotificationsAuditService],
})
export class NotificationsAuditModule {}
