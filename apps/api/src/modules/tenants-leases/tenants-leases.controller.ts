import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { Tenant, Lease, RentCharge } from '@rental-saas/contracts';

@Controller()
export class TenantsLeasesController {
  constructor(private readonly dataStore: DataStoreService) {}

  private getEffectiveWsId(wsId?: string): string {
    return wsId || this.dataStore.workspaces[0]?.id || 'w1111111-1111-4111-8111-111111111111';
  }

  // --- Tenants ---

  @Get('tenants')
  listTenants(@Headers('x-workspace-id') wsId?: string, @Query('search') search?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let list = this.dataStore.tenants.filter((t) => t.workspaceId === effectiveWsId);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phoneNumber.includes(q)
      );
    }

    return {
      success: true,
      data: list,
    };
  }

  @Post('tenants')
  createTenant(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      fullName: string;
      email: string;
      phoneNumber: string;
      emiratesId?: string;
      passportNumber?: string;
      preferredContact?: any;
      notes?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    if (!body.fullName || !body.email || !body.phoneNumber) {
      throw new BadRequestException('Full name, email, and phone number are required.');
    }

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      workspaceId: effectiveWsId,
      fullName: body.fullName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      emiratesId: body.emiratesId,
      passportNumber: body.passportNumber,
      preferredContact: body.preferredContact || 'email',
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };

    this.dataStore.tenants.push(newTenant);
    this.dataStore.saveToFile();
    return {
      success: true,
      data: newTenant,
    };
  }

  @Patch('tenants/:id')
  updateTenant(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<Tenant>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.tenants.findIndex(
      (t) => t.id === id && t.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Tenant not found');

    this.dataStore.tenants[idx] = {
      ...this.dataStore.tenants[idx],
      ...body,
    };
    this.dataStore.saveToFile();

    return {
      success: true,
      data: this.dataStore.tenants[idx],
    };
  }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.tenants.findIndex(
      (t) => t.id === id && t.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Tenant not found');

    const deleted = this.dataStore.tenants.splice(idx, 1)[0];
    this.dataStore.saveToFile();

    return {
      success: true,
      data: deleted,
    };
  }

  // --- Leases ---

  @Get('leases')
  listLeases(
    @Headers('x-workspace-id') wsId?: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let list = this.dataStore.leases.filter((l) => l.workspaceId === effectiveWsId);

    if (status) {
      list = list.filter((l) => l.status === status);
    }
    if (propertyId) {
      list = list.filter((l) => l.propertyId === propertyId);
    }

    // Enrich with tenant & unit info
    const enriched = list.map((l) => {
      const tenant = this.dataStore.tenants.find((t) => t.id === l.tenantId);
      const unit = this.dataStore.units.find((u) => u.id === l.unitId);
      const property = this.dataStore.properties.find((p) => p.id === l.propertyId);

      return {
        ...l,
        tenantName: tenant?.fullName || 'Unknown Tenant',
        tenantPhone: tenant?.phoneNumber || '',
        unitNumber: unit?.unitNumber || '',
        propertyName: property?.name || '',
      };
    });

    return {
      success: true,
      data: enriched,
    };
  }

  @Post('leases')
  createLease(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      unitId: string;
      propertyId: string;
      tenantId: string;
      startDate: string;
      endDate: string;
      annualRent: string;
      paymentFrequency?: any;
      numberOfCheques?: number;
      securityDeposit?: string;
      termsNotes?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);

    // Validate foreign keys
    const unit = this.dataStore.units.find(
      (u) => u.id === body.unitId && u.workspaceId === effectiveWsId
    );
    if (!unit) throw new BadRequestException('Unit not found in workspace.');

    const tenant = this.dataStore.tenants.find(
      (t) => t.id === body.tenantId && t.workspaceId === effectiveWsId
    );
    if (!tenant) throw new BadRequestException('Tenant not found in workspace.');

    // Enforce overlapping lease policy: cannot have active lease on the same unit
    const hasActiveLease = this.dataStore.leases.some(
      (l) =>
        l.unitId === body.unitId &&
        (l.status === 'active' || l.status === 'expiring') &&
        !(body.startDate > l.endDate || body.endDate < l.startDate)
    );
    if (hasActiveLease) {
      throw new BadRequestException('This unit already has an active lease for overlapping dates.');
    }

    const rentAmt = parseFloat(body.annualRent);
    if (isNaN(rentAmt) || rentAmt <= 0) {
      throw new BadRequestException('Annual rent must be greater than zero.');
    }

    const newLease: Lease = {
      id: `l-${Date.now()}`,
      workspaceId: effectiveWsId,
      unitId: body.unitId,
      propertyId: body.propertyId || unit.propertyId,
      tenantId: body.tenantId,
      startDate: body.startDate,
      endDate: body.endDate,
      annualRent: body.annualRent,
      paymentFrequency: body.paymentFrequency || 'quarterly',
      numberOfCheques: body.numberOfCheques || 4,
      securityDeposit: body.securityDeposit || '0.00',
      status: 'active',
      termsNotes: body.termsNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.leases.push(newLease);

    // Update unit status to occupied
    unit.status = 'occupied';
    unit.currentLeaseId = newLease.id;

    // Automatically generate quarterly rent charges (every 3 months) through bank cheques
    const freq = newLease.paymentFrequency || 'quarterly';
    const installments =
      freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : freq === 'semi-annual' ? 2 : 1;
    const installmentAmt = (rentAmt / installments).toFixed(2);
    const monthsPerInstallment = Math.round(12 / installments);

    const [startYear, startMonth, startDay] = newLease.startDate.split('-').map(Number);

    for (let i = 0; i < installments; i++) {
      const chargeDate = new Date(startYear, startMonth - 1 + i * monthsPerInstallment, startDay);
      const dueDateStr = chargeDate.toISOString().slice(0, 10);

      const charge: RentCharge = {
        id: `rc-${Date.now()}-${i + 1}`,
        workspaceId: effectiveWsId,
        leaseId: newLease.id,
        propertyId: newLease.propertyId,
        unitId: newLease.unitId,
        tenantId: newLease.tenantId,
        periodStart: dueDateStr,
        periodEnd: newLease.endDate,
        dueDate: dueDateStr,
        amount: installmentAmt,
        paidAmount: '0.00',
        outstandingAmount: installmentAmt,
        status: 'pending',
        notes: `Cheque ${i + 1} of ${installments} (Quarterly PDC - Due every 3 months)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.dataStore.rentCharges.push(charge);
    }

    this.dataStore.saveToFile();

    return {
      success: true,
      data: newLease,
    };
  }

  @Patch('leases/:id')
  updateLease(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<Lease>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.leases.findIndex(
      (l) => l.id === id && l.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Lease not found');

    this.dataStore.leases[idx] = {
      ...this.dataStore.leases[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();

    return {
      success: true,
      data: this.dataStore.leases[idx],
    };
  }

  @Delete('leases/:id')
  deleteLease(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.leases.findIndex(
      (l) => l.id === id && l.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Lease not found');

    const lease = this.dataStore.leases.splice(idx, 1)[0];

    // Vacate unit if it was occupied by this lease
    const unit = this.dataStore.units.find((u) => u.id === lease.unitId);
    if (unit && unit.currentLeaseId === lease.id) {
      unit.status = 'vacant';
      unit.currentLeaseId = undefined;
    }

    // Also remove associated rent charges
    this.dataStore.rentCharges = this.dataStore.rentCharges.filter((c) => c.leaseId !== lease.id);

    this.dataStore.saveToFile();

    return {
      success: true,
      data: lease,
    };
  }
}
