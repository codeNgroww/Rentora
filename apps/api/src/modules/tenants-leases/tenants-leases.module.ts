import { Module } from '@nestjs/common';
import { TenantsLeasesController } from './tenants-leases.controller';
import { TenantsLeasesService } from './tenants-leases.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [TenantsLeasesController],
  providers: [TenantsLeasesService],
  exports: [TenantsLeasesService],
})
export class TenantsLeasesModule {}
