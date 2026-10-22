import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Tenant, Lease, RentCharge } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateLeaseDto } from './dto/create-lease.dto';

@Injectable()
export class TenantsLeasesService {
  private readonly logger = new Logger(TenantsLeasesService.name);

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly activityLogsService: ActivityLogsService
  ) {}

  private resolveCompanyId(companyId?: string): string {
    return (
      companyId ||
      this.dataStore.companies[0]?.id ||
      this.dataStore.workspaces[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  // --- TENANTS ---

  async listTenants(companyId?: string, search?: string): Promise<Tenant[]> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          ?.from('tenants')
          .select('*')
          .eq('company_id', effectiveCompanyId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data
            .map((t: any) => ({
              id: t.id,
              companyId: t.company_id,
              workspaceId: t.company_id,
              fullName: t.full_name,
              email: t.email,
              phoneNumber: t.phone_number,
              emiratesId: t.emirates_id,
              passportNumber: t.passport_number,
              preferredContact: t.preferred_contact || 'email',
              notes: t.notes || '',
              isDeleted: t.is_deleted ?? false,
              deletedAt: t.deleted_at || null,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            }))
            .filter((t: any) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                t.fullName.toLowerCase().includes(q) ||
                t.email.toLowerCase().includes(q) ||
                t.phoneNumber?.includes(q)
              );
            });
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch tenants from Supabase: ${(err as Error).message}`);
      }
    }

    let list = this.dataStore.tenants.filter(
      (t) => (t.companyId === effectiveCompanyId || (t as any).workspaceId === effectiveCompanyId) && !t.isDeleted
    );

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phoneNumber.includes(q)
      );
    }

    return list;
  }

  async createTenant(dto: CreateTenantDto, companyId?: string): Promise<Tenant> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (!dto.fullName || !dto.email || !dto.phoneNumber) {
      throw new BadRequestException('Full name, email, and phone number are required.');
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const newTenant: Tenant = {
      id,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      emiratesId: dto.emiratesId,
      passportNumber: dto.passportNumber,
      preferredContact: dto.preferredContact || 'email',
      notes: dto.notes || '',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('tenants').insert({
          id: newTenant.id,
          company_id: newTenant.companyId,
          full_name: newTenant.fullName,
          email: newTenant.email,
          phone_number: newTenant.phoneNumber,
          emirates_id: newTenant.emiratesId,
          passport_number: newTenant.passportNumber,
          preferred_contact: newTenant.preferredContact,
          notes: newTenant.notes,
          is_deleted: false,
          created_at: newTenant.createdAt,
          updated_at: newTenant.updatedAt,
        });
      } catch (err) {
        this.logger.warn(`Failed to insert tenant into Supabase: ${(err as Error).message}`);
      }
    }

    this.dataStore.tenants.push(newTenant);
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      collectionName: 'tenants',
      recordId: newTenant.id,
      action: 'CREATE',
      newData: newTenant,
      actorName: 'Admin User',
    });

    return newTenant;
  }

  async updateTenant(id: string, updates: Partial<Tenant>, companyId?: string): Promise<Tenant> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.tenants.findIndex(
      (t) => t.id === id && (t.companyId === effectiveCompanyId || (t as any).workspaceId === effectiveCompanyId) && !t.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Tenant not found');

    const oldData = { ...this.dataStore.tenants[idx] };
    this.dataStore.tenants[idx] = {
      ...this.dataStore.tenants[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('tenants').update({
          full_name: updates.fullName ?? oldData.fullName,
          email: updates.email ?? oldData.email,
          phone_number: updates.phoneNumber ?? oldData.phoneNumber,
          emirates_id: updates.emiratesId ?? oldData.emiratesId,
          passport_number: updates.passportNumber ?? oldData.passportNumber,
          notes: updates.notes ?? oldData.notes,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to update tenant in Supabase: ${(err as Error).message}`);
      }
    }

    const updated = this.dataStore.tenants[idx];
    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      collectionName: 'tenants',
      recordId: id,
      action: 'UPDATE',
      oldData,
      newData: updated,
      actorName: 'Admin User',
    });

    return updated;
  }

  async deleteTenant(id: string, companyId?: string): Promise<Tenant> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.tenants.findIndex(
      (t) => t.id === id && (t.companyId === effectiveCompanyId || (t as any).workspaceId === effectiveCompanyId) && !t.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Tenant not found');

    const now = new Date().toISOString();
    const tenant = this.dataStore.tenants[idx];
    tenant.isDeleted = true;
    tenant.deletedAt = now;
    tenant.updatedAt = now;
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('tenants').update({ is_deleted: true, deleted_at: now }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to soft delete tenant from Supabase: ${(err as Error).message}`);
      }
    }

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      collectionName: 'tenants',
      recordId: id,
      action: 'DELETE',
      oldData: tenant,
      actorName: 'Admin User',
    });

    return tenant;
  }

  // --- LEASES ---

  async listLeases(companyId?: string, status?: string, propertyId?: string): Promise<any[]> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        let query = client
          ?.from('leases')
          .select('*, tenants(full_name, phone_number), properties(name), units(unit_number)')
          .eq('company_id', effectiveCompanyId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (propertyId) query = query.eq('property_id', propertyId);

        const { data, error } = await query;
        if (!error && data) {
          return data.map((l: any) => ({
            id: l.id,
            companyId: l.company_id,
            workspaceId: l.company_id,
            propertyId: l.property_id,
            unitId: l.unit_id,
            unitIds: l.unit_ids || [l.unit_id],
            tenantId: l.tenant_id,
            startDate: l.start_date,
            endDate: l.end_date,
            annualRent: String(l.annual_rent),
            paymentFrequency: l.payment_frequency,
            numberOfCheques: l.number_of_cheques,
            securityDeposit: String(l.security_deposit || '0.00'),
            status: l.status,
            termsNotes: l.terms_notes || '',
            cheques: l.cheques || [],
            isDeleted: l.is_deleted ?? false,
            deletedAt: l.deleted_at || null,
            tenantName: l.tenants?.full_name || 'Unknown Tenant',
            tenantPhone: l.tenants?.phone_number || '',
            unitNumber: l.units?.unit_number || '',
            propertyName: l.properties?.name || '',
            createdAt: l.created_at,
            updatedAt: l.updated_at,
          }));
        }
      } catch (err) {
        this.logger.warn(`Failed to list leases from Supabase: ${(err as Error).message}`);
      }
    }

    let list = this.dataStore.leases.filter(
      (l) => (l.companyId === effectiveCompanyId || (l as any).workspaceId === effectiveCompanyId) && !l.isDeleted
    );

    if (status) {
      list = list.filter((l) => l.status === status);
    }
    if (propertyId) {
      list = list.filter((l) => l.propertyId === propertyId);
    }

    return list.map((l) => {
      const tenant = this.dataStore.tenants.find((t) => t.id === l.tenantId && !t.isDeleted);
      const property = this.dataStore.properties.find((p) => p.id === l.propertyId && !p.isDeleted);
      const unitIds = l.unitIds && l.unitIds.length > 0 ? l.unitIds : [l.unitId];
      const matchedUnits = this.dataStore.units.filter((u) => unitIds.includes(u.id) && !u.isDeleted);
      const unitNumbers = matchedUnits.map((u) => u.unitNumber).join(', ');

      return {
        ...l,
        tenantName: tenant?.fullName || 'Unknown Tenant',
        tenantPhone: tenant?.phoneNumber || '',
        unitNumber: unitNumbers || (matchedUnits[0]?.unitNumber || ''),
        propertyName: property?.name || '',
      };
    });
  }

  createLease(dto: CreateLeaseDto, companyId?: string): Lease {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (!dto.tenantId || !dto.propertyId || !dto.startDate || !dto.endDate) {
      throw new BadRequestException('tenantId, propertyId, startDate, and endDate are required.');
    }

    const targetUnitIds =
      dto.unitIds && dto.unitIds.length > 0 ? dto.unitIds : dto.unitId ? [dto.unitId] : [];
    if (targetUnitIds.length === 0) {
      throw new BadRequestException('At least one unit must be selected for the lease.');
    }

    const tenant = this.dataStore.tenants.find((t) => t.id === dto.tenantId && !t.isDeleted);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const property = this.dataStore.properties.find((p) => p.id === dto.propertyId && !p.isDeleted);
    if (!property) throw new NotFoundException('Property not found');

    // Overlap validation across all units
    const requestedStart = dto.startDate;
    const requestedEnd = dto.endDate;

    for (const uid of targetUnitIds) {
      const unit = this.dataStore.units.find((u) => u.id === uid && !u.isDeleted);
      if (!unit) {
        throw new NotFoundException(`Unit ${uid} not found`);
      }

      const conflictingLease = this.dataStore.leases.find((l) => {
        const matchesUnit =
          l.unitId === uid || (l.unitIds && l.unitIds.includes(uid));
        if (!matchesUnit || l.status === 'terminated' || l.status === 'ended' || l.isDeleted) {
          return false;
        }
        return !(requestedEnd < l.startDate || requestedStart > l.endDate);
      });

      if (conflictingLease) {
        throw new BadRequestException(
          `Unit ${unit.unitNumber} already has an active lease for overlapping dates (${conflictingLease.startDate} to ${conflictingLease.endDate}).`
        );
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const rentAmt = parseFloat(dto.annualRent || '0');

    const newLease: Lease = {
      id,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      propertyId: dto.propertyId,
      unitId: targetUnitIds[0],
      unitIds: targetUnitIds,
      tenantId: dto.tenantId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      annualRent: rentAmt.toFixed(2),
      paymentFrequency: dto.paymentFrequency || 'quarterly',
      numberOfCheques: dto.numberOfCheques || 4,
      securityDeposit: dto.securityDeposit ? parseFloat(dto.securityDeposit).toFixed(2) : '0.00',
      status: 'active',
      termsNotes: dto.termsNotes || '',
      cheques: dto.cheques || [],
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Auto-generate rent charges
    const generatedCharges: RentCharge[] = [];

    if (newLease.cheques && newLease.cheques.length > 0) {
      const startYearStr = newLease.startDate.slice(0, 4);
      newLease.cheques = newLease.cheques.map((c: any, i: number) => ({
        ...c,
        proformaInvoiceNumber:
          c.proformaInvoiceNumber ||
          `PI-${startYearStr}-${newLease.id.slice(-4)}-${String(i + 1).padStart(2, '0')}`,
      }));

      newLease.cheques.forEach((chq: any, i: number) => {
        const charge: RentCharge = {
          id: randomUUID(),
          companyId: effectiveCompanyId,
          workspaceId: effectiveCompanyId,
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
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };
        generatedCharges.push(charge);
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
          id: randomUUID(),
          companyId: effectiveCompanyId,
          workspaceId: effectiveCompanyId,
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
          notes: `Rent installment ${i + 1} of ${installments}`,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };
        generatedCharges.push(charge);
      }
      newLease.cheques = generatedCheques;
    }

    // Persist to Supabase in background if connected
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        if (client) {
          void this.persistLeaseToSupabase(client, newLease, generatedCharges, targetUnitIds);
        }
      } catch (err) {
        this.logger.warn(`Failed to persist lease to Supabase: ${(err as Error).message}`);
      }
    }

    // Local DataStore persistence
    this.dataStore.leases.push(newLease);
    this.dataStore.rentCharges.push(...generatedCharges);

    for (const uid of targetUnitIds) {
      const u = this.dataStore.units.find((unit) => unit.id === uid);
      if (u) {
        u.status = 'occupied';
        u.currentLeaseId = newLease.id;
        u.currentTenantName = tenant.fullName;
      }
    }
    this.dataStore.saveToFile();

    void this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: newLease.propertyId,
      collectionName: 'leases',
      recordId: newLease.id,
      action: 'CREATE',
      newData: newLease,
      actorName: 'Admin User',
    });

    return newLease;
  }

  private async persistLeaseToSupabase(
    client: any,
    newLease: Lease,
    generatedCharges: RentCharge[],
    targetUnitIds: string[]
  ) {
    await client.from('leases').insert({
      id: newLease.id,
      company_id: newLease.companyId,
      property_id: newLease.propertyId,
      unit_id: newLease.unitId,
      tenant_id: newLease.tenantId,
      start_date: newLease.startDate,
      end_date: newLease.endDate,
      annual_rent: parseFloat(newLease.annualRent),
      payment_frequency: newLease.paymentFrequency,
      number_of_cheques: newLease.numberOfCheques,
      security_deposit: parseFloat(newLease.securityDeposit),
      status: newLease.status,
      terms_notes: newLease.termsNotes,
      is_deleted: false,
      created_at: newLease.createdAt,
      updated_at: newLease.updatedAt,
    });

    if (generatedCharges.length > 0) {
      await client.from('rent_charges').insert(
        generatedCharges.map((rc) => ({
          id: rc.id,
          company_id: rc.companyId,
          lease_id: rc.leaseId,
          property_id: rc.propertyId,
          unit_id: rc.unitId,
          tenant_id: rc.tenantId,
          period_start: rc.periodStart,
          period_end: rc.periodEnd,
          due_date: rc.dueDate,
          amount: parseFloat(rc.amount),
          paid_amount: parseFloat(rc.paidAmount),
          status: rc.status,
          is_deleted: false,
          created_at: rc.createdAt,
          updated_at: rc.updatedAt,
        }))
      );
    }

    for (const uid of targetUnitIds) {
      await client.from('units').update({
        status: 'occupied',
        current_lease_id: newLease.id,
      }).eq('id', uid);
    }
  }

  async updateLease(id: string, updates: Partial<Lease>, companyId?: string): Promise<Lease> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.leases.findIndex(
      (l) => l.id === id && (l.companyId === effectiveCompanyId || (l as any).workspaceId === effectiveCompanyId) && !l.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Lease not found');

    const oldData = { ...this.dataStore.leases[idx] };
    this.dataStore.leases[idx] = {
      ...this.dataStore.leases[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('leases').update({
          status: updates.status ?? oldData.status,
          terms_notes: updates.termsNotes ?? oldData.termsNotes,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to update lease in Supabase: ${(err as Error).message}`);
      }
    }

    const updated = this.dataStore.leases[idx];
    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: updated.propertyId,
      collectionName: 'leases',
      recordId: id,
      action: 'UPDATE',
      oldData,
      newData: updated,
      actorName: 'Admin User',
    });

    return updated;
  }

  async deleteLease(id: string, companyId?: string): Promise<Lease> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.leases.findIndex(
      (l) => l.id === id && (l.companyId === effectiveCompanyId || (l as any).workspaceId === effectiveCompanyId) && !l.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Lease not found');

    const now = new Date().toISOString();
    const lease = this.dataStore.leases[idx];
    lease.isDeleted = true;
    lease.deletedAt = now;
    lease.updatedAt = now;

    const targetUnitIds =
      lease.unitIds && lease.unitIds.length > 0 ? lease.unitIds : [lease.unitId];

    this.dataStore.units.forEach((u) => {
      if (targetUnitIds.includes(u.id)) {
        u.status = 'vacant';
        u.currentLeaseId = undefined;
        u.currentTenantName = undefined;
      }
    });

    this.dataStore.rentCharges.forEach((c) => {
      if (c.leaseId === lease.id) {
        c.isDeleted = true;
        c.deletedAt = now;
      }
    });
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('leases').update({ is_deleted: true, deleted_at: now }).eq('id', id);
        await client?.from('rent_charges').update({ is_deleted: true, deleted_at: now }).eq('lease_id', id);
        for (const uid of targetUnitIds) {
          await client?.from('units').update({
            status: 'vacant',
            current_lease_id: null,
          }).eq('id', uid);
        }
      } catch (err) {
        this.logger.warn(`Failed to soft delete lease from Supabase: ${(err as Error).message}`);
      }
    }

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: lease.propertyId,
      collectionName: 'leases',
      recordId: id,
      action: 'DELETE',
      oldData: lease,
      actorName: 'Admin User',
    });

    return lease;
  }
}
