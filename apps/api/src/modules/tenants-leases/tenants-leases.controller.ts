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
      const property = this.dataStore.properties.find((p) => p.id === l.propertyId);

      const unitIds = l.unitIds && l.unitIds.length > 0 ? l.unitIds : [l.unitId];
      const matchedUnits = this.dataStore.units.filter((u) => unitIds.includes(u.id));
      const unitNumbers = matchedUnits.map((u) => u.unitNumber).join(', ');

      return {
        ...l,
        tenantName: tenant?.fullName || 'Unknown Tenant',
        tenantPhone: tenant?.phoneNumber || '',
        unitNumber: unitNumbers || (matchedUnits[0]?.unitNumber || ''),
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
      unitIds?: string[];
      propertyId: string;
      tenantId: string;
      startDate: string;
      endDate: string;
      annualRent: string;
      paymentFrequency?: any;
      numberOfCheques?: number;
      securityDeposit?: string;
      termsNotes?: string;
      cheques?: any[];
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);

    const targetUnitIds =
      body.unitIds && body.unitIds.length > 0 ? body.unitIds : [body.unitId];

    // Validate foreign keys
    const units = this.dataStore.units.filter(
      (u) => targetUnitIds.includes(u.id) && u.workspaceId === effectiveWsId
    );
    if (units.length === 0) throw new BadRequestException('No valid units found in workspace.');

    const tenant = this.dataStore.tenants.find(
      (t) => t.id === body.tenantId && t.workspaceId === effectiveWsId
    );
    if (!tenant) throw new BadRequestException('Tenant not found in workspace.');

    // Enforce overlapping lease policy: cannot have active lease on any of the target units
    for (const uid of targetUnitIds) {
      const hasActiveLease = this.dataStore.leases.some(
        (l) =>
          ((l.unitIds && l.unitIds.includes(uid)) || l.unitId === uid) &&
          (l.status === 'active' || l.status === 'expiring') &&
          !(body.startDate > l.endDate || body.endDate < l.startDate)
      );
      if (hasActiveLease) {
        const u = units.find((x) => x.id === uid);
        throw new BadRequestException(
          `Unit ${u?.unitNumber || uid} already has an active lease for overlapping dates.`
        );
      }
    }

    const rentAmt = parseFloat(body.annualRent);
    if (isNaN(rentAmt) || rentAmt <= 0) {
      throw new BadRequestException('Annual rent must be greater than zero.');
    }

    const newLease: Lease = {
      id: `l-${Date.now()}`,
      workspaceId: effectiveWsId,
      unitId: targetUnitIds[0],
      unitIds: targetUnitIds,
      propertyId: body.propertyId || units[0].propertyId,
      tenantId: body.tenantId,
      startDate: body.startDate,
      endDate: body.endDate,
      annualRent: body.annualRent,
      paymentFrequency: body.paymentFrequency || 'quarterly',
      numberOfCheques: body.numberOfCheques || (body.cheques ? body.cheques.length : 4),
      securityDeposit: body.securityDeposit || '0.00',
      status: 'active',
      termsNotes: body.termsNotes || '',
      cheques: body.cheques || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.leases.push(newLease);

    // Update all target units status to occupied
    units.forEach((u) => {
      u.status = 'occupied';
      u.currentLeaseId = newLease.id;
      u.currentTenantName = tenant.fullName;
    });

    const numCheques = body.numberOfCheques || (body.cheques ? body.cheques.length : 4);
    const startYearStr = newLease.startDate ? newLease.startDate.slice(0, 4) : '2026';

    // Generate Rent Charges: Use customized cheques if provided, or calculate installments
    if (body.cheques && Array.isArray(body.cheques) && body.cheques.length > 0) {
      newLease.cheques = body.cheques.map((c: any, i: number) => ({
        ...c,
        proformaInvoiceNumber: c.proformaInvoiceNumber || `PI-${startYearStr}-${newLease.id.slice(-4)}-${String(i + 1).padStart(2, '0')}`,
      }));

      newLease.cheques.forEach((chq: any, i: number) => {
        const charge: RentCharge = {
          id: `rc-${Date.now()}-${i + 1}`,
          workspaceId: effectiveWsId,
          leaseId: newLease.id,
          propertyId: newLease.propertyId,
          unitId: newLease.unitId,
          tenantId: newLease.tenantId,
          periodStart: chq.dueDate || newLease.startDate,
          periodEnd: newLease.endDate,
          dueDate: chq.dueDate || newLease.startDate,
          amount: parseFloat(chq.amount || '0').toFixed(2),
          paidAmount: '0.00',
          outstandingAmount: parseFloat(chq.amount || '0').toFixed(2),
          status: 'pending',
          invoiceNumber: chq.proformaInvoiceNumber,
          installmentIndex: i + 1,
          installmentTotal: newLease.cheques!.length,
          notes:
            chq.notes ||
            `Cheque ${i + 1} of ${newLease.cheques!.length} ${chq.bankName ? `(${chq.bankName})` : ''} ${chq.chequeNumber ? `CHQ #${chq.chequeNumber}` : ''}`.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.dataStore.rentCharges.push(charge);
      });
    } else {
      const freq = newLease.paymentFrequency || 'quarterly';
      const installments =
        freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : freq === 'semi-annual' ? 2 : 1;
      const installmentAmt = (rentAmt / installments).toFixed(2);
      const monthsPerInstallment = Math.round(12 / installments);

      const [startYear, startMonth, startDay] = newLease.startDate.split('-').map(Number);
      const generatedCheques: any[] = [];

      for (let i = 0; i < installments; i++) {
        const chargeDate = new Date(startYear, startMonth - 1 + i * monthsPerInstallment, startDay);
        const dueDateStr = chargeDate.toISOString().slice(0, 10);
        const piNumber = `PI-${startYear}-${newLease.id.slice(-4)}-${String(i + 1).padStart(2, '0')}`;

        generatedCheques.push({
          chequeNumber: `CHQ-${1001 + i}`,
          dueDate: dueDateStr,
          amount: installmentAmt,
          bankName: 'Emirates NBD',
          notes: `Installment ${i + 1} of ${installments}`,
          proformaInvoiceNumber: piNumber,
        });

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
          invoiceNumber: piNumber,
          installmentIndex: i + 1,
          installmentTotal: installments,
          notes: `Cheque ${i + 1} of ${installments} (Quarterly PDC - Due every 3 months)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.dataStore.rentCharges.push(charge);
      }
      newLease.cheques = generatedCheques;
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

    // Vacate all units that were occupied by this lease
    const targetUnitIds =
      lease.unitIds && lease.unitIds.length > 0 ? lease.unitIds : [lease.unitId];
    this.dataStore.units.forEach((u) => {
      if (targetUnitIds.includes(u.id)) {
        u.status = 'vacant';
        u.currentLeaseId = undefined;
        u.currentTenantName = undefined;
      }
    });

    // Also remove associated rent charges
    this.dataStore.rentCharges = this.dataStore.rentCharges.filter((c) => c.leaseId !== lease.id);

    this.dataStore.saveToFile();

    return {
      success: true,
      data: lease,
    };
  }
}
