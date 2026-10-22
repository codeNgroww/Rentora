import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Optional,
  Inject,
} from '@nestjs/common';
import { Tenant, Lease } from '@rental-saas/contracts';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { TenantsLeasesService } from './tenants-leases.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateLeaseDto } from './dto/create-lease.dto';

@Controller()
export class TenantsLeasesController {
  private readonly tenantsLeasesService: TenantsLeasesService;

  constructor(
    @Optional() @Inject(TenantsLeasesService) serviceOrStore?: TenantsLeasesService | DataStoreService
  ) {
    if (serviceOrStore instanceof DataStoreService) {
      const sup = new SupabaseService();
      const act = new ActivityLogsService(sup);
      this.tenantsLeasesService = new TenantsLeasesService(serviceOrStore, sup, act);
    } else if (serviceOrStore) {
      this.tenantsLeasesService = serviceOrStore;
    } else {
      const ds = new DataStoreService();
      ds.onModuleInit();
      const sup = new SupabaseService();
      const act = new ActivityLogsService(sup);
      this.tenantsLeasesService = new TenantsLeasesService(ds, sup, act);
    }
  }

  // --- Tenants ---

  @Get('tenants')
  async listTenants(
    @CompanyId() companyId: string,
    @Query('search') search?: string
  ) {
    const data = await this.tenantsLeasesService.listTenants(companyId, search);
    return {
      success: true,
      data,
    };
  }

  @Post('tenants')
  async createTenant(
    @CompanyId() companyId: string,
    @Body() dto: CreateTenantDto
  ) {
    const data = await this.tenantsLeasesService.createTenant(dto, companyId);
    return {
      success: true,
      data,
    };
  }

  @Patch('tenants/:id')
  async updateTenant(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<Tenant>
  ) {
    const data = await this.tenantsLeasesService.updateTenant(id, body, companyId);
    return {
      success: true,
      data,
    };
  }

  @Delete('tenants/:id')
  async deleteTenant(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.tenantsLeasesService.deleteTenant(id, companyId);
    return {
      success: true,
      data,
    };
  }

  // --- Leases ---

  @Get('leases')
  async listLeases(
    @CompanyId() companyId: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string
  ) {
    const data = await this.tenantsLeasesService.listLeases(companyId, status, propertyId);
    return {
      success: true,
      data,
    };
  }

  @Post('leases')
  createLease(
    @CompanyId() companyId: string,
    @Body() dto: CreateLeaseDto
  ) {
    const data = this.tenantsLeasesService.createLease(dto, companyId);
    return {
      success: true,
      data,
    };
  }

  @Patch('leases/:id')
  async updateLease(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<Lease>
  ) {
    const data = await this.tenantsLeasesService.updateLease(id, body, companyId);
    return {
      success: true,
      data,
    };
  }

  @Delete('leases/:id')
  async deleteLease(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.tenantsLeasesService.deleteLease(id, companyId);
    return {
      success: true,
      data,
    };
  }
}
