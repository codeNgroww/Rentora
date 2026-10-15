import { Module } from '@nestjs/common';
import { DataStoreService } from './database/data-store.service';
import { WorkspacesController } from './modules/workspaces/workspaces.controller';
import { PropertiesController } from './modules/properties/properties.controller';
import { TenantsLeasesController } from './modules/tenants-leases/tenants-leases.controller';
import { ExpensesController } from './modules/expenses/expenses.controller';
import { RentController } from './modules/rent/rent.controller';
import { DashboardController } from './modules/dashboard/dashboard.controller';
import { ReportsController } from './modules/reports/reports.controller';
import { NotificationsAuditController } from './modules/notifications-audit/notifications-audit.controller';

@Module({
  imports: [],
  controllers: [
    WorkspacesController,
    PropertiesController,
    TenantsLeasesController,
    ExpensesController,
    RentController,
    DashboardController,
    ReportsController,
    NotificationsAuditController,
  ],
  providers: [DataStoreService],
  exports: [DataStoreService],
})
export class AppModule {}
