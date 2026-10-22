import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { TenantsLeasesModule } from './modules/tenants-leases/tenants-leases.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { RentModule } from './modules/rent/rent.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { NotificationsAuditModule } from './modules/notifications-audit/notifications-audit.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validate,
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    SuperAdminModule,
    PropertiesModule,
    TenantsLeasesModule,
    ExpensesModule,
    RentModule,
    DashboardModule,
    ReportsModule,
    WorkspacesModule,
    NotificationsAuditModule,
    ActivityLogsModule,
    HealthModule,
  ],
})
export class AppModule {}
